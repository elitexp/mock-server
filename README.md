# Mock API Server

A comprehensive mock API server built with Next.js, TypeScript, and Prisma. This server provides user management, authentication, domain-based routing, and highly configurable mock endpoints with dynamic response matching.

## Features

- **User Management & Authentication**: Complete JWT-based authentication system
- **Domain-Based Routing**: Only accept requests from configured domains
- **CRUD Operations**: Full domain and endpoint management
- **Configurable Endpoints**: Support for GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD methods
- **Dynamic Response Matching**: Multiple responses per endpoint based on headers, cookies, query params, and body
- **Database Storage**: SQLite database with Prisma ORM
- **Server-Side Rendering**: Built with Next.js App Router for optimal performance
- **Type Safety**: Full TypeScript implementation with Zod validation

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with bcryptjs
- **Validation**: Zod schemas
- **Styling**: Tailwind CSS
- **Deployment**: Ready for Vercel deployment

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Environment Variables

The `.env` file is already configured with:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
JWT_SECRET="your-jwt-secret-key-here"
```

### 3. Start Development Server

```bash
npm run dev
```

The server will be running at `http://localhost:3000`

## API Usage Examples

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@test.com","password":"password123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"password123"}'
```

### 3. Create a Domain
```bash
curl -X POST http://localhost:3000/api/domains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"api.example.com"}'
```

### 4. Create an Endpoint
```bash
curl -X POST http://localhost:3000/api/domains/DOMAIN_ID/endpoints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"path":"/api/users","method":"GET","description":"Get users"}'
```

### 5. Create a Response
```bash
curl -X POST http://localhost:3000/api/domains/DOMAIN_ID/endpoints/ENDPOINT_ID/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Success","statusCode":200,"responseData":{"users":[{"id":1,"name":"John"}]}}'
```

### 6. Test Mock Endpoint
```bash
curl http://localhost:3000/api/mock/users \
  -H "x-mock-domain: api.example.com"
```

## Key Features Explained

### Domain-Based Routing
- Only requests with matching domain headers are processed
- Use `Host` header or `x-mock-domain` header to specify domain
- Each user can manage multiple domains

### Response Matching
- Multiple responses per endpoint with priority-based selection
- Conditions based on headers, cookies, query params, or request body
- Operators: EQUALS, CONTAINS, STARTS_WITH, ENDS_WITH, REGEX_MATCH

### Authentication
- JWT-based authentication with Bearer tokens
- Password hashing with bcryptjs
- User roles (USER, ADMIN) for future expansion

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints  
│   │   ├── domains/      # Domain management
│   │   └── mock/         # Mock API handler
│   ├── dashboard/        # Dashboard page
│   └── page.tsx          # Home page
├── lib/
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts            # Database connection
│   ├── mock-utils.ts    # Mock server logic
│   └── validations.ts   # Zod schemas
└── prisma/
    ├── schema.prisma    # Database schema
    └── migrations/      # Database migrations
```

## Development Commands
# or
pnpm dev
# or
bun dev
```

```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Start production server
npm start

# Database operations
npx prisma migrate dev    # Apply migrations
npx prisma generate      # Generate client
npx prisma studio        # Open database GUI
```

## Contributing

1. Fork the repository
2. Create a feature branch  
3. Make changes with proper TypeScript types
4. Test your changes
5. Submit a pull request

## License

MIT License - feel free to use this project for your mock API needs!

## Running as a System Service (macOS)

To enable automatic DNS cache flushing and system-level network configuration, you must run the Mock Server as a root-level service using launchd.

### Build and Install the Service

1. Build the service and update the configuration:

   ```sh
   ./build-service.sh
   ```

2. Install and start the service (requires root):

   ```sh
   sudo ./service.sh install
   ```

3. Check service status:

   ```sh
   sudo ./service.sh status
   ```

4. View logs:

   ```sh
   ./service.sh logs
   ./service.sh errors
   ```

5. Uninstall the service:

   ```sh
   sudo ./service.sh uninstall
   ```

### Why root is required

- The service must run as root to allow automatic DNS cache flushing on macOS (using `dscacheutil` and `mDNSResponder`).
- If the service is not run as root, DNS flush will fail and you may need to flush the cache manually.
- All service management commands (`install`, `uninstall`, `restart`) must be run with `sudo`.
