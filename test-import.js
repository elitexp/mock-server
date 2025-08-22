// Test the import of dnsmasqManager
try {
  const { dnsmasqManager } = require("./src/lib/dnsmasq.ts");
  console.log("Import successful:", typeof dnsmasqManager);
} catch (error) {
  console.error("Import failed:", error.message);
}
