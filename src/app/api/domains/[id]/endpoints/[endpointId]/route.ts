import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { endpointUpdateSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; endpointId: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const endpoint = await prisma.endpoint.findFirst({
      where: {
        id: resolvedParams.endpointId,
        domain: {
          id: resolvedParams.id,
          userId: user.id,
        },
      },
      include: {
        domain: true,
        responses: {
          include: {
            conditions: true,
          },
          orderBy: { priority: "desc" },
        },
      },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ endpoint });
  } catch (error) {
    console.error("Get endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; endpointId: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = endpointUpdateSchema.parse(body);

    // Check if endpoint exists and user owns the domain
    const existingEndpoint = await prisma.endpoint.findFirst({
      where: {
        id: resolvedParams.endpointId,
        domain: {
          id: resolvedParams.id,
          userId: user.id,
        },
      },
    });

    if (!existingEndpoint) {
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    // If path or method is being updated, check for conflicts
    if (
      (validatedData.path && validatedData.path !== existingEndpoint.path) ||
      (validatedData.method && validatedData.method !== existingEndpoint.method)
    ) {
      const conflictEndpoint = await prisma.endpoint.findUnique({
        where: {
          domainId_path_method: {
            domainId: resolvedParams.id,
            path: validatedData.path || existingEndpoint.path,
            method: validatedData.method || existingEndpoint.method,
          },
        },
      });

      if (
        conflictEndpoint &&
        conflictEndpoint.id !== resolvedParams.endpointId
      ) {
        return NextResponse.json(
          {
            error:
              "Endpoint with this path and method already exists for this domain",
          },
          { status: 409 }
        );
      }
    }

    const endpoint = await prisma.endpoint.update({
      where: { id: resolvedParams.endpointId },
      data: validatedData,
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    return NextResponse.json({
      message: "Endpoint updated successfully",
      endpoint,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; endpointId: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if endpoint exists and user owns the domain
    const endpoint = await prisma.endpoint.findFirst({
      where: {
        id: resolvedParams.endpointId,
        domain: {
          id: resolvedParams.id,
          userId: user.id,
        },
      },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    await prisma.endpoint.delete({
      where: { id: resolvedParams.endpointId },
    });

    return NextResponse.json({
      message: "Endpoint deleted successfully",
    });
  } catch (error) {
    console.error("Delete endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
