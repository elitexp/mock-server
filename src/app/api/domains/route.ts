import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { domainCreateSchema } from "@/lib/validations";
import { dnsmasqManager } from "@/lib/dnsmasq";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeEndpoints = searchParams.get("include") === "endpoints";

    const domains = await prisma.domain.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { endpoints: true },
        },
        ...(includeEndpoints && {
          endpoints: {
            where: { active: true },
            select: {
              id: true,
              path: true,
              method: true,
            },
          },
        }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ domains });
  } catch (error) {
    console.error("Get domains error:", error);
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

    const body = await request.json();
    const validatedData = domainCreateSchema.parse(body);

    // Check if domain already exists for this user
    const existingDomain = await prisma.domain.findUnique({
      where: { name: validatedData.name },
    });

    if (existingDomain) {
      return NextResponse.json(
        { error: "Domain already exists" },
        { status: 409 }
      );
    }

    const domain = await prisma.domain.create({
      data: {
        name: validatedData.name,
        userId: user.id,
      },
      include: {
        _count: {
          select: { endpoints: true },
        },
      },
    });

    // Add DNS entry if dnsmasq is available
    try {
      if (await dnsmasqManager.isHerdDnsmasqAvailable()) {
        await dnsmasqManager.addDomain(validatedData.name);
      }
    } catch (error) {
      console.error("DNS configuration error:", error);
      // Don't fail the request if DNS setup fails
    }

    return NextResponse.json(
      {
        message: "Domain created successfully",
        domain,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create domain error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
