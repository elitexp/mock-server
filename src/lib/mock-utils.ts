import { NextRequest } from "next/server";
import { prisma } from "./db";
import { ConditionOperator, ConditionType } from "@prisma/client";

export interface RequestConditions {
  headers: Record<string, string>;
  cookies: Record<string, string>;
  query: Record<string, string>;
  body: any;
}

export function extractRequestConditions(
  request: NextRequest
): RequestConditions {
  // Extract headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  // Extract cookies
  const cookies: Record<string, string> = {};
  request.cookies.getAll().forEach((cookie) => {
    cookies[cookie.name] = cookie.value;
  });

  // Extract query parameters
  const query: Record<string, string> = {};
  const url = new URL(request.url);
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return { headers, cookies, query, body: null };
}

export async function extractRequestBody(request: NextRequest): Promise<any> {
  try {
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      return await request.json();
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      const body: Record<string, any> = {};
      formData.forEach((value, key) => {
        body[key] = value;
      });
      return body;
    } else if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const body: Record<string, any> = {};
      formData.forEach((value, key) => {
        body[key] = value;
      });
      return body;
    } else {
      return await request.text();
    }
  } catch {
    return null;
  }
}

export function matchCondition(
  condition: {
    type: ConditionType;
    field: string;
    operator: ConditionOperator;
    value: string;
  },
  requestData: RequestConditions
): boolean {
  let actualValue: string = "";

  // Get the actual value based on condition type
  switch (condition.type) {
    case "HEADER":
      actualValue = requestData.headers[condition.field.toLowerCase()] || "";
      break;
    case "COOKIE":
      actualValue = requestData.cookies[condition.field] || "";
      break;
    case "QUERY":
      actualValue = requestData.query[condition.field] || "";
      break;
    case "BODY":
      if (typeof requestData.body === "object" && requestData.body !== null) {
        actualValue = requestData.body[condition.field] || "";
      } else {
        actualValue = requestData.body || "";
      }
      break;
  }

  // Convert to string for comparison
  actualValue = String(actualValue);

  // Apply operator
  switch (condition.operator) {
    case "EQUALS":
      return actualValue === condition.value;
    case "CONTAINS":
      return actualValue.includes(condition.value);
    case "STARTS_WITH":
      return actualValue.startsWith(condition.value);
    case "ENDS_WITH":
      return actualValue.endsWith(condition.value);
    case "REGEX_MATCH":
      try {
        const regex = new RegExp(condition.value, "i");
        return regex.test(actualValue);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export async function findMatchingResponse(
  endpointId: string,
  requestData: RequestConditions
) {
  const responses = await prisma.endpointResponse.findMany({
    where: {
      endpointId,
      active: true,
    },
    include: {
      conditions: true,
    },
    orderBy: {
      priority: "desc",
    },
  });

  for (const response of responses) {
    // If no conditions, this response matches
    if (response.conditions.length === 0) {
      return response;
    }

    // Check if all conditions match
    const allConditionsMatch = response.conditions.every((condition) =>
      matchCondition(condition, requestData)
    );

    if (allConditionsMatch) {
      return response;
    }
  }

  return null;
}

export function getDomainFromRequest(request: NextRequest): string | null {
  // Check custom domain header first
  const domainHeader = request.headers.get("x-mock-domain");
  if (domainHeader) {
    return domainHeader;
  }

  // Extract domain from Host header
  const host = request.headers.get("host");
  if (host) {
    // Remove port if present
    return host.split(":")[0];
  }

  return null;
}

export function createMockResponse(
  response: {
    statusCode: number;
    headers: any;
    cookies: any;
    responseData: any;
  },
  additionalHeaders: Record<string, string> = {}
) {
  const headers = new Headers();

  // Set response headers
  if (response.headers && typeof response.headers === "object") {
    Object.entries(response.headers as Record<string, string>).forEach(
      ([key, value]) => {
        headers.set(key, value);
      }
    );
  }

  // Set additional headers
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  // Set default content type if not provided
  if (!headers.get("content-type")) {
    headers.set("content-type", "application/json");
  }

  const nextResponse = new Response(JSON.stringify(response.responseData), {
    status: response.statusCode,
    headers,
  });

  // Set cookies
  if (response.cookies && typeof response.cookies === "object") {
    Object.entries(response.cookies as Record<string, string>).forEach(
      ([name, value]) => {
        nextResponse.headers.append("Set-Cookie", `${name}=${value}; Path=/`);
      }
    );
  }

  return nextResponse;
}
