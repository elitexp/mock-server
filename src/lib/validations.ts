import { z } from "zod";

// User schemas
export const userRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Domain schemas
export const domainCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Domain name is required")
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
});

export const domainUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Domain name is required")
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format")
    .optional(),
  active: z.boolean().optional(),
});

// Endpoint schemas
export const httpMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
]);

export const endpointCreateSchema = z.object({
  path: z
    .string()
    .min(1, "Path is required")
    .startsWith("/", "Path must start with /"),
  method: httpMethodSchema,
  description: z.string().optional(),
});

export const endpointUpdateSchema = z.object({
  path: z
    .string()
    .min(1, "Path is required")
    .startsWith("/", "Path must start with /")
    .optional(),
  method: httpMethodSchema.optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

// Response schemas
export const conditionTypeSchema = z.enum([
  "HEADER",
  "COOKIE",
  "QUERY",
  "BODY",
]);
export const conditionOperatorSchema = z.enum([
  "EQUALS",
  "CONTAINS",
  "STARTS_WITH",
  "ENDS_WITH",
  "REGEX_MATCH",
]);

export const responseConditionSchema = z.object({
  type: conditionTypeSchema,
  field: z.string().min(1, "Field is required"),
  operator: conditionOperatorSchema,
  value: z.string().min(1, "Value is required"),
});

export const endpointResponseCreateSchema = z.object({
  name: z.string().min(1, "Response name is required"),
  statusCode: z.number().int().min(100).max(599).default(200),
  headers: z.record(z.string(), z.string()).optional(),
  cookies: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
  responseData: z.any(),
  priority: z.number().int().min(0).default(0),
  conditions: z.array(responseConditionSchema).optional(),
});

export const endpointResponseUpdateSchema = z.object({
  name: z.string().min(1, "Response name is required").optional(),
  statusCode: z.number().int().min(100).max(599).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  cookies: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
  responseData: z.any().optional(),
  priority: z.number().int().min(0).optional(),
  conditions: z.array(responseConditionSchema).optional(),
  active: z.boolean().optional(),
});

// Types
export type UserRegister = z.infer<typeof userRegisterSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type DomainCreate = z.infer<typeof domainCreateSchema>;
export type DomainUpdate = z.infer<typeof domainUpdateSchema>;
export type EndpointCreate = z.infer<typeof endpointCreateSchema>;
export type EndpointUpdate = z.infer<typeof endpointUpdateSchema>;
export type EndpointResponseCreate = z.infer<
  typeof endpointResponseCreateSchema
>;
export type EndpointResponseUpdate = z.infer<
  typeof endpointResponseUpdateSchema
>;
export type ResponseCondition = z.infer<typeof responseConditionSchema>;
