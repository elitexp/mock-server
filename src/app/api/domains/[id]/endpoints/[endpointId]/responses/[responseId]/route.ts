import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { endpointResponseUpdateSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; endpointId: string; responseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await prisma.endpointResponse.findFirst({
      where: {
        id: resolvedParams.responseId,
        endpoint: {
          id: resolvedParams.endpointId,
          domain: {
            id: resolvedParams.id,
            userId: user.id,
          },
        },
      },
      include: {
        conditions: true,
        endpoint: {
          include: {
            domain: true,
          },
        },
      },
    });

    if (!response) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Get response error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; endpointId: string; responseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = endpointResponseUpdateSchema.parse(body);

    // Check if response exists and user owns it
    const existingResponse = await prisma.endpointResponse.findFirst({
      where: {
        id: resolvedParams.responseId,
        endpoint: {
          id: resolvedParams.endpointId,
          domain: {
            id: resolvedParams.id,
            userId: user.id,
          },
        },
      },
    });

    if (!existingResponse) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    // Update response and conditions in a transaction
    const response = await prisma.$transaction(async (tx) => {
      // Update response
      await tx.endpointResponse.update({
        where: { id: resolvedParams.responseId },
        data: {
          name: validatedData.name,
          statusCode: validatedData.statusCode,
          headers: validatedData.headers,
          cookies: validatedData.cookies,
          body: validatedData.body,
          responseData: validatedData.responseData,
          priority: validatedData.priority,
          active: validatedData.active,
        },
      });

      // Update conditions if provided
      if (validatedData.conditions !== undefined) {
        // Delete existing conditions
        await tx.responseCondition.deleteMany({
          where: { endpointResponseId: resolvedParams.responseId },
        });

        // Create new conditions
        if (validatedData.conditions.length > 0) {
          await tx.responseCondition.createMany({
            data: validatedData.conditions.map((condition) => ({
              ...condition,
              endpointResponseId: resolvedParams.responseId,
            })),
          });
        }
      }

      return tx.endpointResponse.findUnique({
        where: { id: resolvedParams.responseId },
        include: { conditions: true },
      });
    });

    return NextResponse.json({
      message: "Response updated successfully",
      response,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update response error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; endpointId: string; responseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if response exists and user owns it
    const response = await prisma.endpointResponse.findFirst({
      where: {
        id: resolvedParams.responseId,
        endpoint: {
          id: resolvedParams.endpointId,
          domain: {
            id: resolvedParams.id,
            userId: user.id,
          },
        },
      },
    });

    if (!response) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    await prisma.endpointResponse.delete({
      where: { id: resolvedParams.responseId },
    });

    return NextResponse.json({
      message: "Response deleted successfully",
    });
  } catch (error) {
    console.error("Delete response error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
