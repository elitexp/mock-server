# Mock Server Service Setup

This guide explains how to run the Mock API Server as a system service with root privileges to enable automatic DNS cache flushing and full domain management.

## Quick Start

1. **Build for Production**
   ```bash
   chmod +x build-service.sh
   ./build-service.sh
   ```

2. **Install Service**
   ```bash
   sudo ./service.sh install
   ```

3. **Check Status**
   ```bash
   sudo ./service.sh status
   ```

4. **View Logs**
   ```bash
   ./service.sh logs
   ```

## Benefits of Running as Service

### ✅ Root Privileges Enable:
- **Automatic DNS Cache Flushing** - No more manual `sudo` commands
- **System-level Network Configuration** - Direct access to DNS settings
- **SSL Certificate Management** - Full certificate authority operations
- **Port Binding** - Can bind to privileged ports (80, 443) if needed

### ✅ Service Management:
- **Auto-start** - Service starts automatically on system boot
- **Auto-restart** - Restarts automatically if it crashes
- **Log Management** - Centralized logging to `/var/log/mockserver.log`
- **Background Operation** - Runs in background without user session

## Service Commands

```bash
# Service Management (requires sudo)
sudo ./service.sh install    # Install and start service
sudo ./service.sh uninstall  # Stop and remove service  
sudo ./service.sh restart    # Restart service
sudo ./service.sh status     # Show service status

# Development Commands (no sudo required)
./service.sh logs           # View live application logs
./service.sh errors         # View live error logs
./service.sh build          # Build for production
```

## DNS Cache Management

When running as a service with root privileges, DNS cache flushing works automatically:

```bash
# Before (manual commands required):
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# After (automatic):
# ✅ DNS cache is automatically flushed when domains are added/removed
# ✅ No password prompts
# ✅ Immediate domain resolution
```

## API Usage

The service runs on `http://localhost:3000` with full API functionality:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@mock.server", "password": "admin"}'

# Add Domain (with automatic DNS cache flush)
curl -X POST http://localhost:3000/api/domains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "example.com"}'

# Access Domain
curl -I https://example.com/
```

## File Locations

### Service Files:
- **Service Config**: `/Library/LaunchDaemons/com.mockserver.service.plist`
- **Application Logs**: `/var/log/mockserver.log`
- **Error Logs**: `/var/log/mockserver.error.log`

### Application Files:
- **Project Directory**: `/Library/www/sites/mock-server` (or current directory)
- **Server Script**: `server.js`
- **Service Manager**: `service.sh`
- **Build Script**: `build-service.sh`

## Troubleshooting

### Service Won't Start
```bash
# Check service status
sudo ./service.sh status

# Check error logs
./service.sh errors

# Verify file permissions
ls -la server.js
chmod +x server.js
```

### DNS Issues
```bash
# Test DNS resolution
dig @127.0.0.1 your-domain.com +short

# Check dnsmasq config
cat "/Users/$USER/Library/Application Support/Herd/config/dnsmasq/dnsmasq.conf"

# Restart Herd services
herd restart
```

### Port Conflicts
```bash
# Check what's running on port 3000
lsof -ti:3000

# Kill conflicting processes
kill $(lsof -ti:3000)
```

## Security Considerations

### Root Privileges
The service runs as root to enable system-level DNS management. This is secure because:
- Service is isolated with proper file permissions
- Only specific DNS commands are executed
- Application code runs in controlled environment
- Logs are centralized and monitored

### Network Access
- Service binds only to localhost (127.0.0.1) by default
- HTTPS certificates are properly managed
- All SSL connections use modern TLS protocols

## Development Mode

For development, you can still run without root privileges:

```bash
npm run dev
```

However, DNS cache flushing will require manual intervention:
```bash
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

## Production Deployment

The service is designed for production use with:
- Automatic restart on failure
- Comprehensive logging
- Resource management
- System integration

For production environments, consider:
- Setting up log rotation
- Monitoring service health
- Configuring firewall rules
- Setting up backup procedures
