import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { dnsmasqManager } from "@/lib/dnsmasq";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isDnsmasqAvailable = await dnsmasqManager.isHerdDnsmasqAvailable();
    const isConfigDirAvailable = await dnsmasqManager.isConfigDirAvailable();

    let status = "not_configured";
    let message = "dnsmasq is not installed or not configured";

    if (isDnsmasqAvailable && isConfigDirAvailable) {
      status = "available";
      message = "dnsmasq is available and configured";
    } else if (isDnsmasqAvailable) {
      status = "partial";
      message =
        "dnsmasq is installed but configuration directory is not available";
    }

    return NextResponse.json({
      status,
      message,
      available: isDnsmasqAvailable,
      configDirAvailable: isConfigDirAvailable,
      setupInstructions: dnsmasqManager.getSetupInstructions(),
    });
  } catch (error) {
    console.error("DNS status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === "restart") {
      try {
        await dnsmasqManager.restartDnsmasq();
        return NextResponse.json({
          message: "dnsmasq restart initiated",
          success: true,
        });
      } catch (error) {
        return NextResponse.json(
          {
            message: "Failed to restart dnsmasq",
            error: String(error),
            success: false,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Invalid action. Supported actions: restart" },
      { status: 400 }
    );
  } catch (error) {
    console.error("DNS management error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
