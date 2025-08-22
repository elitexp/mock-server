<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilot-instructions.md-file -->

# Mock API Server Project

This is a comprehensive mock API server built with Next.js, TypeScript, and Prisma with **full HTTPS support and custom domain management** bypassing Laravel Herd's `.test` suffix requirement.

## Project Status - COMPLETED ✅

- [x] **Core Mock API Server** - Next.js 15 with App Router, TypeScript, Tailwind CSS
- [x] **Database & Auth** - SQLite with Prisma, JWT authentication system
- [x] **Domain Management** - CRUD operations with custom domain support
- [x] **HTTPS Integration** - Full SSL certificate automation with Laravel Herd
- [x] **DNS Management** - Custom dnsmasq configuration bypassing `.test` suffix
- [x] **Nginx Proxy** - Automatic reverse proxy setup for custom domains
- [x] **API Routes** - Complete REST API with mock endpoint handling
- [x] **Production Ready** - All services running and accessible

## Critical Implementation Details

### 🔧 **Laravel Herd Integration**

- **Issue Resolved**: User requirement "I don't want the .test" - domains now work WITHOUT `.test` suffix
- **DNS Configuration**: `/Users/sujip/Library/Application Support/Herd/config/dnsmasq/dnsmasq.conf`
- **Nginx Configuration**: `/Users/sujip/Library/Application Support/Herd/config/valet/Nginx/`
- **SSL Certificates**: `/Users/sujip/Library/Application Support/Herd/config/ssl/`

### 🌐 **Working Domains**

- ✅ `https://tms21.nepsetms.com.np` - Custom domain with SSL
- ✅ `https://api.test.com` - Domain containing .test (wildcard conflict resolved)
- ✅ `https://api.mock.com` - Alternative domain format
- ✅ `http://localhost:3000` - Development server

### 📁 **Key Files & Locations**

#### **DNS & HTTPS Management**

- `src/lib/dnsmasq.ts` - **DnsmasqManager class** with:
  - `setupCustomNginxProxy()` - Creates nginx configs without .test suffix
  - `generateSSLCertificate()` - Auto-generates SSL certificates with OpenSSL
  - `addDomainToDnsmasq()` - Adds domains to Herd's DNS configuration
  - `removeCustomNginxProxy()` - Cleanup functionality

#### **API Routes**

- `src/app/api/domains/route.ts` - Domain CRUD with automatic DNS/HTTPS setup
- `src/app/api/auth/login/route.ts` - JWT authentication
- `src/app/api/auth/register/route.ts` - User registration
- `src/lib/validations.ts` - Zod schemas for all API endpoints

#### **Database**

- `prisma/schema.prisma` - Complete database schema
- `src/lib/db.ts` - Prisma client configuration
- `src/lib/auth.ts` - JWT token management

### 🚨 **Critical Configuration Notes**

#### **DNS Conflict Resolution**

- **Problem**: Herd's wildcard `address=/.test/127.0.0.1` conflicted with `api.test.com`
- **Solution**: Removed wildcard rule from dnsmasq.conf
- **Location**: `/Users/sujip/Library/Application Support/Herd/config/dnsmasq/dnsmasq.conf`

#### **Nginx Configuration Format**

- **Directory**: `/Users/sujip/Library/Application Support/Herd/config/valet/Nginx/`
- **Format**: Filename = domain name (e.g., `api.test.com`, `tms21.nepsetms.com.np`)
- **Template**:

```nginx
server {
    listen 127.0.0.1:80;
    listen 127.0.0.1:443 ssl;
    http2 on;
    server_name DOMAIN_NAME;

    ssl_certificate "/Users/sujip/Library/Application Support/Herd/config/ssl/DOMAIN_NAME.crt";
    ssl_certificate_key "/Users/sujip/Library/Application Support/Herd/config/ssl/DOMAIN_NAME.key";

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    access_log off;
    error_log "/Users/sujip/Library/Application Support/Herd/Log/nginx-error.log";
}
```

#### **SSL Certificate Generation**

- **Tool**: OpenSSL with SAN (Subject Alternative Name) support
- **Location**: `/Users/sujip/Library/Application Support/Herd/config/ssl/`
- **Files**: `DOMAIN.crt` and `DOMAIN.key`
- **Command**: `openssl req -x509 -newkey rsa:2048 -keyout domain.key -out domain.crt -days 365 -nodes`

### 🔄 **Service Management**

- **Restart Nginx**: `herd restart nginx`
- **Restart DNS**: `herd restart dnsmasq`
- **Test Config**: `nginx -t -c /path/to/nginx.conf`

### 🧪 **Testing Commands**

```bash
# Test domain creation
curl -X POST http://127.0.0.1:3000/api/domains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"name": "example.com"}'

# Test domain access
curl -I https://example.com/

# Test DNS resolution
dig +short example.com

# Login to get JWT token
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@mock.server", "password": "admin"}'
```

### ⚠️ **Troubleshooting Guide**

1. **Domain not resolving**: Check `/Users/sujip/Library/Application Support/Herd/config/dnsmasq/dnsmasq.conf`
2. **HTTPS not working**: Verify SSL certificates exist in `/Users/sujip/Library/Application Support/Herd/config/ssl/`
3. **Nginx errors**: Check syntax with `nginx -t` and error logs in `/Users/sujip/Library/Application Support/Herd/Log/`
4. **504 Gateway Timeout**: Ensure Next.js server is running on port 3000
5. **DNS conflicts**: Remove wildcard `.test` rules that interfere with specific domains

### 🎯 **User Authentication**

- **Default Admin**: `admin@mock.server` / `admin`
- **JWT Token**: Required for all domain management API calls
- **Role**: ADMIN role has full access to all endpoints

## Features Implemented ✅

✅ **Core Server**: Next.js 15 with TypeScript, App Router, Tailwind CSS
✅ **Authentication**: JWT-based user registration and login  
✅ **Domain Management**: Full CRUD with automatic DNS/HTTPS configuration
✅ **Custom Domains**: Support for ANY domain without `.test` suffix requirement
✅ **HTTPS Support**: Auto-generated SSL certificates with nginx proxy
✅ **DNS Integration**: Laravel Herd dnsmasq integration with conflict resolution
✅ **Database**: SQLite with Prisma ORM and complete schema
✅ **API Routes**: RESTful endpoints with Zod validation
✅ **Mock Endpoints**: Dynamic endpoint configuration and response matching
✅ **Nginx Proxy**: Automatic reverse proxy configuration
✅ **Service Management**: Full integration with Laravel Herd services

## Architecture Summary

```
Internet Request → DNS (dnsmasq) → Nginx (port 443/80) → Next.js (port 3000)
                     ↓                ↓                     ↓
              Custom domains → SSL certificates → Mock API responses
```

This setup provides a **production-ready mock API server** that can handle any custom domain with automatic HTTPS, bypassing Laravel Herd's `.test` suffix limitation entirely.
