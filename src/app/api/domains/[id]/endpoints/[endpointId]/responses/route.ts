import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { endpointResponseCreateSchema } from "@/lib/validations";

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

    // Verify endpoint ownership
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

    const responses = await prisma.endpointResponse.findMany({
      where: { endpointId: resolvedParams.endpointId },
      include: {
        conditions: true,
      },
      orderBy: { priority: "desc" },
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Get responses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; endpointId: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify endpoint ownership
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

    const body = await request.json();
    const validatedData = endpointResponseCreateSchema.parse(body);

    // Create response with conditions in a transaction
    const response = await prisma.$transaction(async (tx) => {
      const newResponse = await tx.endpointResponse.create({
        data: {
          endpointId: resolvedParams.endpointId,
          name: validatedData.name,
          statusCode: validatedData.statusCode,
          headers: validatedData.headers,
          cookies: validatedData.cookies,
          body: validatedData.body,
          responseData: validatedData.responseData,
          priority: validatedData.priority,
        },
      });

      if (validatedData.conditions && validatedData.conditions.length > 0) {
        await tx.responseCondition.createMany({
          data: validatedData.conditions.map((condition) => ({
            ...condition,
            endpointResponseId: newResponse.id,
          })),
        });
      }

      return tx.endpointResponse.findUnique({
        where: { id: newResponse.id },
        include: { conditions: true },
      });
    });

    return NextResponse.json(
      {
        message: "Response created successfully",
        response,
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

    console.error("Create response error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
