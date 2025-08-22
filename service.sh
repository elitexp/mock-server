#!/bin/bash

# Mock Server Service Management Script
# This script helps install, start, stop, and manage the Mock Server as a system service

set -e

SERVICE_NAME="com.mockserver.service"
PLIST_FILE="$PWD/com.mockserver.service.plist"
SYSTEM_PLIST="/Library/LaunchDaemons/$SERVICE_NAME.plist"
SERVER_FILE="$PWD/server.js"
LOG_FILE="/var/log/mockserver.log"
ERROR_LOG="/var/log/mockserver.error.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "         Mock Server Service Manager"
    echo "=================================================="
    echo -e "${NC}"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

check_files() {
    if [[ ! -f "$PLIST_FILE" ]]; then
        print_error "Service plist file not found: $PLIST_FILE"
        exit 1
    fi
    
    if [[ ! -f "$SERVER_FILE" ]]; then
        print_error "Server file not found: $SERVER_FILE"
        print_warning "Make sure to run 'npm run build' first"
        exit 1
    fi
}

install_service() {
    print_header
    echo "Installing Mock Server Service..."
    echo
    
    check_files
    
    # Stop service if running
    if launchctl list | grep -q "$SERVICE_NAME"; then
        print_warning "Service is running, stopping first..."
        launchctl unload "$SYSTEM_PLIST" 2>/dev/null || true
    fi
    
    # Copy plist file
    print_status "Copying service configuration..."
    cp "$PLIST_FILE" "$SYSTEM_PLIST"
    chown root:wheel "$SYSTEM_PLIST"
    chmod 644 "$SYSTEM_PLIST"
    
    # Create log files
    print_status "Setting up log files..."
    touch "$LOG_FILE" "$ERROR_LOG"
    chown root:wheel "$LOG_FILE" "$ERROR_LOG"
    chmod 644 "$LOG_FILE" "$ERROR_LOG"
    
    # Make server file executable
    print_status "Setting up server executable..."
    chmod +x "$SERVER_FILE"
    
    # Load and start service
    print_status "Loading service..."
    launchctl load "$SYSTEM_PLIST"
    
    # Wait a moment and check status
    sleep 2
    if launchctl list | grep -q "$SERVICE_NAME"; then
        print_status "Service installed and started successfully!"
        echo
        echo -e "${BLUE}Service Details:${NC}"
        echo "  Name: $SERVICE_NAME"
        echo "  Config: $SYSTEM_PLIST"
        echo "  Logs: $LOG_FILE"
        echo "  Error Logs: $ERROR_LOG"
        echo "  URL: http://localhost:3000"
        echo
        echo -e "${BLUE}Management Commands:${NC}"
        echo "  Status:  sudo launchctl list | grep mockserver"
        echo "  Stop:    sudo launchctl unload $SYSTEM_PLIST"
        echo "  Start:   sudo launchctl load $SYSTEM_PLIST"
        echo "  Logs:    tail -f $LOG_FILE"
        echo "  Errors:  tail -f $ERROR_LOG"
    else
        print_error "Service failed to start!"
        echo "Check logs: tail $ERROR_LOG"
        exit 1
    fi
}

uninstall_service() {
    print_header
    echo "Uninstalling Mock Server Service..."
    echo
    
    # Stop service if running
    if launchctl list | grep -q "$SERVICE_NAME"; then
        print_status "Stopping service..."
        launchctl unload "$SYSTEM_PLIST"
    fi
    
    # Remove plist file
    if [[ -f "$SYSTEM_PLIST" ]]; then
        print_status "Removing service configuration..."
        rm "$SYSTEM_PLIST"
    fi
    
    print_status "Service uninstalled successfully!"
    print_warning "Log files preserved: $LOG_FILE, $ERROR_LOG"
}

status_service() {
    print_header
    echo "Mock Server Service Status:"
    echo
    
    if launchctl list | grep -q "$SERVICE_NAME"; then
        print_status "Service is RUNNING"
        echo
        echo -e "${BLUE}Service Info:${NC}"
        launchctl list | grep "$SERVICE_NAME"
        echo
        echo -e "${BLUE}Recent Logs (last 10 lines):${NC}"
        tail -n 10 "$LOG_FILE" 2>/dev/null || echo "No logs found"
    else
        print_warning "Service is NOT RUNNING"
        echo
        if [[ -f "$SYSTEM_PLIST" ]]; then
            echo "Service is installed but not running."
            echo "Start with: sudo launchctl load $SYSTEM_PLIST"
        else
            echo "Service is not installed."
            echo "Install with: sudo $0 install"
        fi
    fi
}

show_logs() {
    print_header
    echo "Mock Server Logs:"
    echo
    
    if [[ -f "$LOG_FILE" ]]; then
        echo -e "${BLUE}=== Application Logs ===${NC}"
        tail -f "$LOG_FILE"
    else
        print_warning "Log file not found: $LOG_FILE"
    fi
}

show_error_logs() {
    print_header
    echo "Mock Server Error Logs:"
    echo
    
    if [[ -f "$ERROR_LOG" ]]; then
        echo -e "${BLUE}=== Error Logs ===${NC}"
        tail -f "$ERROR_LOG"
    else
        print_warning "Error log file not found: $ERROR_LOG"
    fi
}

build_and_prepare() {
    print_header
    echo "Building Mock Server for Production..."
    echo
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] || [[ ! -f "next.config.js" ]]; then
        print_error "Not in Mock Server directory. Please run from the project root."
        exit 1
    fi
    
    print_status "Installing dependencies..."
    npm install
    
    print_status "Building Next.js application..."
    npm run build
    
    print_status "Preparing server file..."
    chmod +x server.js
    
    print_status "Build completed successfully!"
    echo
    echo "Next steps:"
    echo "  1. Install service: sudo $0 install"
    echo "  2. Check status: sudo $0 status"
}

# Main script logic
case "${1:-}" in
    "install")
        check_root
        install_service
        ;;
    "uninstall")
        check_root
        uninstall_service
        ;;
    "status")
        status_service
        ;;
    "logs")
        show_logs
        ;;
    "errors")
        show_error_logs
        ;;
    "build")
        build_and_prepare
        ;;
    "restart")
        check_root
        print_header
        echo "Restarting Mock Server Service..."
        if launchctl list | grep -q "$SERVICE_NAME"; then
            launchctl unload "$SYSTEM_PLIST"
            sleep 1
            launchctl load "$SYSTEM_PLIST"
            sleep 2
            status_service
        else
            print_warning "Service is not running"
            status_service
        fi
        ;;
    *)
        print_header
        echo "Usage: $0 {install|uninstall|status|logs|errors|build|restart}"
        echo
        echo "Commands:"
        echo "  build     - Build the application for production"
        echo "  install   - Install and start the service (requires sudo)"
        echo "  uninstall - Stop and remove the service (requires sudo)"
        echo "  restart   - Restart the service (requires sudo)"
        echo "  status    - Show service status"
        echo "  logs      - Show application logs (live)"
        echo "  errors    - Show error logs (live)"
        echo
        echo "Examples:"
        echo "  $0 build"
        echo "  sudo $0 install"
        echo "  sudo $0 status"
        echo "  $0 logs"
        exit 1
        ;;
esac
