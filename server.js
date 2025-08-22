#!/usr/bin/env node

/**
 * Production server for Mock API Server
 * This server runs with root privileges to handle DNS cache flushing
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// Configuration
const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log(
  `🚀 Starting Mock Server in ${dev ? "development" : "production"} mode...`
);
console.log(`   → Process UID: ${process.getuid()}`);
console.log(`   → Process GID: ${process.getgid()}`);
console.log(`   → Running as: ${process.getuid() === 0 ? "root" : "user"}`);

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`✅ Mock Server ready on http://${hostname}:${port}`);
    console.log(
      `   → DNS cache flushing: ${
        process.getuid() === 0 ? "✅ Enabled (root)" : "⚠️ Limited (user)"
      }`
    );
    console.log(
      `   → HTTPS proxy management: ${
        process.getuid() === 0 ? "✅ Enabled" : "⚠️ Limited"
      }`
    );

    // Log environment info
    console.log("\n📊 Environment Info:");
    console.log(`   → Node.js version: ${process.version}`);
    console.log(`   → Platform: ${process.platform}`);
    console.log(`   → Architecture: ${process.arch}`);
    console.log(`   → Working directory: ${process.cwd()}`);
    console.log(
      `   → Log files: /var/log/mockserver.log, /var/log/mockserver.error.log`
    );
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});
