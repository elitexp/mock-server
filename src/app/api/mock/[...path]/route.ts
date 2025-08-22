import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getDomainFromRequest,
  extractRequestConditions,
  extractRequestBody,
  findMatchingResponse,
  createMockResponse,
} from "@/lib/mock-utils";

export async function GET(request: NextRequest) {
  return handleMockRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleMockRequest(request, "POST");
}

export async function PUT(request: NextRequest) {
  return handleMockRequest(request, "PUT");
}

export async function PATCH(request: NextRequest) {
  return handleMockRequest(request, "PATCH");
}

export async function DELETE(request: NextRequest) {
  return handleMockRequest(request, "DELETE");
}

export async function OPTIONS(request: NextRequest) {
  return handleMockRequest(request, "OPTIONS");
}

export async function HEAD(request: NextRequest) {
  return handleMockRequest(request, "HEAD");
}

async function handleMockRequest(request: NextRequest, method: string) {
  try {
    // Extract domain from request
    const domainName = getDomainFromRequest(request);

    if (!domainName) {
      return NextResponse.json(
        {
          error:
            "Domain not specified. Use Host header or x-mock-domain header.",
        },
        { status: 400 }
      );
    }

    // Find domain
    const domain = await prisma.domain.findFirst({
      where: {
        name: domainName,
        active: true,
      },
    });

    if (!domain) {
      return NextResponse.json(
        { error: `Domain '${domainName}' not found or inactive` },
        { status: 404 }
      );
    }

    // Extract path from URL
    const url = new URL(request.url);
    const path = url.pathname;

    // Find matching endpoint
    const endpoint = await prisma.endpoint.findFirst({
      where: {
        domainId: domain.id,
        path,
        method: method as any,
        active: true,
      },
    });

    if (!endpoint) {
      return NextResponse.json(
        {
          error: `Endpoint ${method} ${path} not found for domain ${domainName}`,
        },
        { status: 404 }
      );
    }

    // Extract request conditions
    const requestConditions = extractRequestConditions(request);

    // Extract request body if needed
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      try {
        requestConditions.body = await extractRequestBody(request);
      } catch (error) {
        console.error("Error extracting request body:", error);
      }
    }

    // Find matching response based on conditions
    const matchingResponse = await findMatchingResponse(
      endpoint.id,
      requestConditions
    );

    if (!matchingResponse) {
      return NextResponse.json(
        { error: "No matching response configuration found" },
        { status: 404 }
      );
    }

    // Return mock response
    return createMockResponse(matchingResponse, {
      "x-mock-domain": domainName,
      "x-mock-endpoint": endpoint.id,
      "x-mock-response": matchingResponse.id,
    });
  } catch (error) {
    console.error("Mock request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
