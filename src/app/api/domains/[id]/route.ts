import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { domainUpdateSchema } from "@/lib/validations";
import { dnsmasqManager } from "@/lib/dnsmasq";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domain = await prisma.domain.findFirst({
      where: {
        id: resolvedParams.id,
        userId: user.id,
      },
      include: {
        endpoints: {
          include: {
            _count: {
              select: { responses: true },
            },
          },
        },
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    return NextResponse.json({ domain });
  } catch (error) {
    console.error("Get domain error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = domainUpdateSchema.parse(body);

    // Check if domain exists and belongs to user
    const existingDomain = await prisma.domain.findFirst({
      where: {
        id: resolvedParams.id,
        userId: user.id,
      },
    });

    if (!existingDomain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // If name is being updated, check for conflicts
    if (validatedData.name && validatedData.name !== existingDomain.name) {
      const nameConflict = await prisma.domain.findUnique({
        where: { name: validatedData.name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Domain name already exists" },
          { status: 409 }
        );
      }
    }

    const domain = await prisma.domain.update({
      where: { id: resolvedParams.id },
      data: validatedData,
      include: {
        _count: {
          select: { endpoints: true },
        },
      },
    });

    // Handle dnsmasq updates if domain name changed
    if (validatedData.name && validatedData.name !== existingDomain.name) {
      try {
        if (await dnsmasqManager.isHerdDnsmasqAvailable()) {
          // Remove old domain and add new domain
          await dnsmasqManager.removeDomain(existingDomain.name);
          await dnsmasqManager.addDomain(validatedData.name);
        } else {
          console.log(
            "dnsmasq not available, skipping DNS configuration update"
          );
        }
      } catch (dnsError) {
        console.error("Failed to update dnsmasq configuration:", dnsError);
        // Don't fail the request if DNS update fails
      }
    }

    return NextResponse.json({
      message: "Domain updated successfully",
      domain,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update domain error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if domain exists and belongs to user
    const domain = await prisma.domain.findFirst({
      where: {
        id: resolvedParams.id,
        userId: user.id,
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // Remove domain from dnsmasq before deleting from database
    const domainName = domain.name;

    await prisma.domain.delete({
      where: { id: resolvedParams.id },
    });

    // Remove domain from dnsmasq configuration
    try {
      if (await dnsmasqManager.isHerdDnsmasqAvailable()) {
        await dnsmasqManager.removeDomain(domainName);
      } else {
        console.log(
          "dnsmasq not available, skipping DNS configuration cleanup"
        );
      }
    } catch (dnsError) {
      console.error(
        "Failed to remove domain from dnsmasq configuration:",
        dnsError
      );
      // Don't fail the request if DNS cleanup fails
    }

    return NextResponse.json({
      message: "Domain deleted successfully",
    });
  } catch (error) {
    console.error("Delete domain error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
