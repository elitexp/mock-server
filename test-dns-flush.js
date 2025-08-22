#!/usr/bin/env node

/**
 * Test script for DNS cache flushing functionality
 * This script demonstrates the improved DNS cache management
 */

const { dnsmasqManager } = require("./src/lib/dnsmasq.ts");

async function testDnsFlush() {
  console.log("🧪 Testing DNS cache flush functionality...\n");

  // Test domain
  const testDomain = "test-dns-flush.local";

  try {
    // Check if passwordless sudo is available
    console.log("1️⃣ Checking passwordless sudo availability...");
    const canFlush = await dnsmasqManager.canFlushDnsWithoutPassword();
    console.log(
      `   → Passwordless DNS flush: ${
        canFlush ? "✅ Available" : "❌ Not available"
      }`
    );

    if (!canFlush) {
      console.log("\n🔧 Setting up passwordless DNS flush...");
      console.log("   → This will require your password once");
      const setupResult = await dnsmasqManager.setupPasswordlessDnsFlush();
      console.log(
        `   → Setup result: ${setupResult ? "✅ Success" : "❌ Failed"}`
      );
    }

    console.log("\n2️⃣ Adding test domain...");
    await dnsmasqManager.addDomain(testDomain);

    console.log("\n3️⃣ Testing domain resolution...");
    // Test resolution with dig
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync(
        `dig @127.0.0.1 ${testDomain} +short +time=3`
      );
      const resolved = stdout.trim();
      if (resolved === "127.0.0.1") {
        console.log(`   → ✅ ${testDomain} resolves correctly to 127.0.0.1`);
      } else {
        console.log(
          `   → ⚠️ ${testDomain} resolves to: ${resolved || "No response"}`
        );
      }
    } catch (error) {
      console.log(`   → ❌ DNS resolution test failed: ${error.message}`);
    }

    console.log("\n4️⃣ Cleaning up...");
    await dnsmasqManager.removeDomain(testDomain);

    console.log("\n✅ DNS flush test completed!");
    console.log("\nUsage in your application:");
    console.log("  // For one-time setup (optional, improves performance):");
    console.log("  await dnsmasqManager.setupPasswordlessDnsFlush();");
    console.log("  ");
    console.log("  // Add domain with automatic DNS cache flush:");
    console.log('  await dnsmasqManager.addDomain("example.com");');
    console.log("  ");
    console.log("  // Remove domain with DNS cleanup:");
    console.log('  await dnsmasqManager.removeDomain("example.com");');
  } catch (error) {
    console.error(`❌ Test failed:`, error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testDnsFlush().catch(console.error);
}

module.exports = { testDnsFlush };
