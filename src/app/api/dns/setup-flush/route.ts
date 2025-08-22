import { NextRequest, NextResponse } from "next/server";
import { dnsmasqManager } from "@/lib/dnsmasq";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Check current status
    const canFlush = await (dnsmasqManager as any).canFlushDnsWithoutPassword();

    if (canFlush) {
      return NextResponse.json({
        success: true,
        message: "Passwordless DNS flush is already configured",
        status: "already_configured",
      });
    }

    // Setup passwordless DNS flush
    const setupResult = await (
      dnsmasqManager as any
    ).setupPasswordlessDnsFlush();

    if (setupResult) {
      return NextResponse.json({
        success: true,
        message: "Passwordless DNS flush configured successfully",
        status: "configured",
        note: "DNS cache will now be flushed automatically when domains are added/removed",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to configure passwordless DNS flush",
          status: "failed",
          manual_steps: [
            "Add the following line to /etc/sudoers.d/dns-flush:",
            `${process.env.USER} ALL=(ALL) NOPASSWD: /usr/bin/dscacheutil -flushcache, /usr/bin/killall -HUP mDNSResponder`,
          ],
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("DNS flush setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to setup DNS flush",
        details: error.message,
        manual_command:
          "sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyJWT(request);
    if (!authResult.isValid || authResult.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Check if passwordless DNS flush is available
    const canFlush = await (dnsmasqManager as any).canFlushDnsWithoutPassword();
    const isHerdAvailable = await dnsmasqManager.isHerdDnsmasqAvailable();

    return NextResponse.json({
      dns_flush_available: canFlush,
      herd_available: isHerdAvailable,
      status: canFlush ? "configured" : "requires_setup",
      message: canFlush
        ? "DNS cache flushing is configured and working"
        : "DNS cache flushing requires password or setup",
      setup_endpoint: "/api/dns/setup-flush",
      manual_command:
        "sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder",
    });
  } catch (error: any) {
    console.error("DNS status check error:", error);
    return NextResponse.json(
      { error: "Failed to check DNS status", details: error.message },
      { status: 500 }
    );
  }
}
