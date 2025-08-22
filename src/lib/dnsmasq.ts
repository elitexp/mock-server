import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);
const HERD_CONFIG_DIR = path.join(
  process.env.HOME || "",
  "Library/Application Support/Herd/config/dnsmasq"
);

export class DnsmasqManager {
  async isHerdDnsmasqAvailable(): Promise<boolean> {
    try {
      // Check if Herd config directory exists
      await fs.access(HERD_CONFIG_DIR);

      // Check if Herd dnsmasq process is running
      const { stdout } = await execAsync(
        'ps aux | grep -v grep | grep "Herd.app.*dnsmasq"'
      );
      const isAvailable = stdout.trim().length > 0;

      if (isAvailable) {
        console.log("✅ Laravel Herd dnsmasq detected and available");
      } else {
        console.log(
          "ℹ️ Herd config directory exists but dnsmasq process not found"
        );
      }

      return isAvailable;
    } catch (error) {
      console.log("ℹ️ Laravel Herd not available, DNS management disabled");
      return false;
    }
  }

  async addDomain(domain: string): Promise<void> {
    if (!(await this.isHerdDnsmasqAvailable())) {
      console.log(
        `ℹ️ DNS: Herd not available, skipping DNS entry for ${domain}`
      );
      return;
    }

    try {
      const confFilePath = path.join(HERD_CONFIG_DIR, "dnsmasq.conf");
      const entry = `address=/${domain}/127.0.0.1`;

      // Read existing content
      let content = await fs.readFile(confFilePath, "utf-8");

      // Add domain if not already present
      if (!content.includes(`address=/${domain}/`)) {
        // Add our entry after the existing entries but before listen-address
        const lines = content.split("\n");
        const insertIndex = lines.findIndex((line) =>
          line.startsWith("listen-address=")
        );

        if (insertIndex > 0) {
          // Insert before listen-address
          lines.splice(insertIndex, 0, entry);
        } else {
          // Append at the end
          lines.push(entry);
        }

        content = lines.join("\n");

        // Backup original file
        await fs.copyFile(confFilePath, `${confFilePath}.backup.${Date.now()}`);

        // Write updated content
        await fs.writeFile(confFilePath, content);

        console.log(`✅ Added ${domain} to Herd dnsmasq configuration`);
        console.log(`   → Configuration: ${confFilePath}`);
        console.log(`   → Domain will resolve to 127.0.0.1`);

        // Signal Herd to reload dnsmasq
        try {
          await execAsync("herd restart > /dev/null 2>&1");
          console.log(
            "   → Restarted Herd services to reload DNS configuration"
          );
        } catch (error) {
          console.log(
            "   → Failed to restart Herd services, configuration may need manual reload"
          );
        }
      } else {
        console.log(
          `ℹ️ Domain ${domain} already exists in Herd dnsmasq config`
        );
      }
    } catch (error) {
      console.error(`❌ Failed to add ${domain} to Herd dnsmasq:`, error);
    }
  }

  async removeDomain(domain: string): Promise<void> {
    if (!(await this.isHerdDnsmasqAvailable())) {
      return;
    }

    try {
      const confFilePath = path.join(HERD_CONFIG_DIR, "dnsmasq.conf");
      const content = await fs.readFile(confFilePath, "utf-8");
      const lines = content.split("\n");
      const filteredLines = lines.filter(
        (line) => !line.includes(`address=/${domain}/`)
      );

      if (lines.length !== filteredLines.length) {
        // Backup original file before modifying
        await fs.copyFile(confFilePath, `${confFilePath}.backup.${Date.now()}`);

        await fs.writeFile(confFilePath, filteredLines.join("\n"));
        console.log(`✅ Removed ${domain} from Herd dnsmasq configuration`);

        // Signal Herd to reload dnsmasq
        try {
          await execAsync("herd restart > /dev/null 2>&1");
          console.log(
            "   → Restarted Herd services to reload DNS configuration"
          );
        } catch (error) {
          console.log(
            "   → Failed to restart Herd services, configuration may need manual reload"
          );
        }
      } else {
        console.log(`ℹ️ Domain ${domain} was not found in dnsmasq config`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove ${domain} from Herd dnsmasq:`, error);
    }
  }
}

export const dnsmasqManager = new DnsmasqManager();
