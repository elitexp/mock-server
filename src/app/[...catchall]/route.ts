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
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, x-mock-domain, Host",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function HEAD(request: NextRequest) {
  return handleMockRequest(request, "HEAD");
}

async function handleMockRequest(request: NextRequest, method: string) {
  try {
    // Extract domain from request - prioritize Host header
    const host = request.headers.get("host");
    let domainName = host?.split(":")[0]; // Remove port if present

    // Fallback to x-mock-domain header if needed
    if (!domainName) {
      domainName = request.headers.get("x-mock-domain") || undefined;
    }

    if (!domainName) {
      return NextResponse.json(
        {
          error:
            "Domain not specified. Use Host header or x-mock-domain header.",
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization, x-mock-domain, Host",
          },
        }
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
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization, x-mock-domain, Host",
          },
        }
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
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization, x-mock-domain, Host",
          },
        }
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
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization, x-mock-domain, Host",
          },
        }
      );
    }

    // Return mock response
    return createMockResponse(matchingResponse, {
      "x-mock-domain": domainName,
      "x-mock-endpoint": endpoint.id,
      "x-mock-response": matchingResponse.id,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, x-mock-domain, Host",
    });
  } catch (error) {
    console.error("Mock request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, x-mock-domain, Host",
        },
      }
    );
  }
}
