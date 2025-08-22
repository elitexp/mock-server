import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { endpointCreateSchema } from "@/lib/validations";

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

    // Verify domain ownership
    const domain = await prisma.domain.findFirst({
      where: {
        id: resolvedParams.id,
        userId: user.id,
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const endpoints = await prisma.endpoint.findMany({
      where: { domainId: resolvedParams.id },
      include: {
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ endpoints });
  } catch (error) {
    console.error("Get endpoints error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify domain ownership
    const domain = await prisma.domain.findFirst({
      where: {
        id: resolvedParams.id,
        userId: user.id,
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = endpointCreateSchema.parse(body);

    // Check if endpoint already exists for this domain
    const existingEndpoint = await prisma.endpoint.findUnique({
      where: {
        domainId_path_method: {
          domainId: resolvedParams.id,
          path: validatedData.path,
          method: validatedData.method,
        },
      },
    });

    if (existingEndpoint) {
      return NextResponse.json(
        {
          error:
            "Endpoint with this path and method already exists for this domain",
        },
        { status: 409 }
      );
    }

    const endpoint = await prisma.endpoint.create({
      data: {
        ...validatedData,
        domainId: resolvedParams.id,
      },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Endpoint created successfully",
        endpoint,
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

    console.error("Create endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
