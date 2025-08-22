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

      // Setup HTTPS proxy for the domain
      await this.setupHttpsProxy(domain);
    } catch (error) {
      console.error(`❌ Failed to add ${domain} to Herd dnsmasq:`, error);
    }
  }

  /**
   * Setup HTTPS proxy and SSL certificate for a domain without .test suffix
   */
  async setupHttpsProxy(domain: string): Promise<void> {
    try {
      // Determine which port our mock server is running on
      const mockServerPort = await this.detectMockServerPort();

      console.log(`🔒 Setting up HTTPS proxy for ${domain}...`);

      // Remove existing proxy if it exists (including any .test versions)
      try {
        await execAsync(`herd unproxy ${domain}.test`);
        console.log(`   → Removed existing .test proxy`);
      } catch {
        // Ignore if doesn't exist
      }

      try {
        await execAsync(`herd unproxy ${domain}`);
        console.log(`   → Removed existing proxy`);
      } catch {
        // Ignore if doesn't exist
      }

      // Create proxy without .test suffix by using a workaround
      // We'll create a nginx config directly to avoid Herd's .test appending
      await this.setupCustomNginxProxy(domain, mockServerPort);

      console.log(
        `   → Created custom proxy: ${domain} → http://127.0.0.1:${mockServerPort}`
      );
      console.log(`   → Direct HTTPS access: https://${domain}`);
    } catch (error) {
      console.error(`❌ Failed to setup HTTPS proxy for ${domain}:`, error);
    }
  }

  /**
   * Setup custom nginx proxy configuration to avoid .test suffix
   */
  public async setupCustomNginxProxy(
    domain: string,
    targetUrl: number = 3000
  ): Promise<boolean> {
    try {
      // Use the correct Herd nginx directory
      const nginxConfigDir = path.join(
        process.env.HOME || "",
        "Library/Application Support/Herd/config/valet/Nginx"
      );

      // Ensure nginx config directory exists
      await fs.mkdir(nginxConfigDir, { recursive: true });

      const configPath = path.join(nginxConfigDir, domain);

      // Generate SSL certificate first
      await this.generateSSLCertificate(domain);

      const nginxConfig = `# Custom proxy for ${domain}
server {
    listen 127.0.0.1:80;
    listen 127.0.0.1:443 ssl;
    http2 on;
    server_name ${domain};
    
    ssl_certificate "${process.env.HOME}/Library/Application Support/Herd/config/ssl/${domain}.crt";
    ssl_certificate_key "${process.env.HOME}/Library/Application Support/Herd/config/ssl/${domain}.key";
    
    location / {
        proxy_pass http://127.0.0.1:${targetUrl};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
    
    access_log off;
    error_log "${process.env.HOME}/Library/Application Support/Herd/Log/nginx-error.log";
}`;

      await fs.writeFile(configPath, nginxConfig);
      console.log(`   → Created nginx config: ${configPath}`);

      // Restart Herd nginx to load new config
      await execAsync("herd restart nginx > /dev/null 2>&1");
      console.log(`   → Restarted nginx to load configuration`);

      return true;
    } catch (error) {
      console.error(`❌ Failed to setup custom nginx proxy:`, error);
      return false;
    }
  }

  /**
   * Remove custom nginx proxy configuration
   */
  public async removeCustomNginxProxy(domain: string): Promise<boolean> {
    try {
      const nginxConfigDir = path.join(
        process.env.HOME || "",
        "Library/Application Support/Herd/config/valet/Nginx"
      );

      const configPath = path.join(nginxConfigDir, domain);

      // Remove nginx config file
      try {
        await fs.unlink(configPath);
        console.log(`   → Removed nginx config: ${configPath}`);
      } catch (error: any) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }

      // Remove SSL certificates
      const sslDir = path.join(
        process.env.HOME || "",
        "Library/Application Support/Herd/config/ssl"
      );

      const certPath = path.join(sslDir, `${domain}.crt`);
      const keyPath = path.join(sslDir, `${domain}.key`);

      try {
        await fs.unlink(certPath);
        await fs.unlink(keyPath);
        console.log(`   → Removed SSL certificates for ${domain}`);
      } catch (error: any) {
        if (error.code !== "ENOENT") {
          console.error(`Warning: Could not remove SSL certificates:`, error);
        }
      }

      // Restart nginx
      await execAsync("herd restart nginx > /dev/null 2>&1");
      console.log(`   → Restarted nginx`);

      return true;
    } catch (error) {
      console.error(
        `❌ Failed to remove custom nginx proxy for ${domain}:`,
        error
      );
      return false;
    }
  }

  /**
   * Generate SSL certificate for the domain
   */
  private async generateSSLCertificate(domain: string): Promise<void> {
    try {
      const sslDir = path.join(
        process.env.HOME || "",
        "Library/Application Support/Herd/config/ssl"
      );

      // Ensure SSL directory exists
      await fs.mkdir(sslDir, { recursive: true });

      const certPath = path.join(sslDir, `${domain}.crt`);
      const keyPath = path.join(sslDir, `${domain}.key`);

      // Check if certificate already exists
      try {
        await fs.access(certPath);
        console.log(`   → SSL certificate already exists for ${domain}`);
        return;
      } catch {
        // Certificate doesn't exist, create it
      }

      // Generate self-signed certificate
      const opensslCmd = `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=Local/L=Local/O=Mock Server/CN=${domain}"`;

      await execAsync(opensslCmd);
      console.log(`   → Generated SSL certificate for ${domain}`);
    } catch (error) {
      console.error(`❌ Failed to generate SSL certificate:`, error);
      throw error;
    }
  }

  /**
   * Detect which port our mock server is running on
   */
  async detectMockServerPort(): Promise<number> {
    try {
      // Check common ports where Next.js dev server runs
      const portsToCheck = [3000, 3001, 3002];

      for (const port of portsToCheck) {
        try {
          const { stdout } = await execAsync(`lsof -ti:${port}`);
          if (stdout.trim()) {
            // Port is in use, check if it's our server
            const response = await fetch(
              `http://localhost:${port}/api/auth/verify`
            );
            if (response.status === 401 || response.status === 200) {
              console.log(`   → Mock server detected on port ${port}`);
              return port;
            }
          }
        } catch {
          // Port not in use or not our server
        }
      }

      // Default to 3000 if detection fails
      console.log(`   → Using default port 3000 (detection failed)`);
      return 3000;
    } catch (error) {
      console.log(`   → Using default port 3000 (error during detection)`);
      return 3000;
    }
  }

  /**
   * Remove HTTPS proxy and SSL certificate for a domain
   */
  async removeHttpsProxy(domain: string): Promise<void> {
    try {
      console.log(`🗑️ Removing HTTPS proxy for ${domain}...`);

      // Remove custom nginx configuration
      try {
        const nginxConfigDir = path.join(
          process.env.HOME || "",
          "Library/Application Support/Herd/config/nginx"
        );
        const configPath = path.join(nginxConfigDir, `${domain}.conf`);

        await fs.unlink(configPath);
        console.log(`   → Removed nginx configuration`);
      } catch {
        // Config may not exist
      }

      // Remove SSL certificate
      try {
        const sslDir = path.join(
          process.env.HOME || "",
          "Library/Application Support/Herd/config/ssl"
        );
        const certPath = path.join(sslDir, `${domain}.crt`);
        const keyPath = path.join(sslDir, `${domain}.key`);

        await fs.unlink(certPath);
        await fs.unlink(keyPath);
        console.log(`   → SSL certificate removed`);
      } catch {
        // Certificates may not exist
      }

      // Remove any Herd proxies (including .test versions)
      try {
        await execAsync(`herd unproxy ${domain}`);
        console.log(`   → Removed Herd proxy`);
      } catch {
        // May not exist
      }

      try {
        await execAsync(`herd unproxy ${domain}.test`);
        console.log(`   → Removed .test proxy`);
      } catch {
        // May not exist
      }

      // Restart nginx to reload configuration
      try {
        await execAsync("herd restart nginx > /dev/null 2>&1");
        console.log(`   → Restarted nginx`);
      } catch (error) {
        console.log(`   → Failed to restart nginx, may need manual restart`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove HTTPS proxy for ${domain}:`, error);
      console.log(`   → Manual cleanup may be required`);
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

        // Remove HTTPS proxy and SSL certificate
        await this.removeHttpsProxy(domain);

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
