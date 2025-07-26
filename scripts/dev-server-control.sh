#!/bin/bash

# AI Business Factory - Reliable Development Server Control
# Provides 100% reliable startup/shutdown procedures for local development

set -e  # Exit on error

WORKSPACE_ROOT="/Users/cnorton/Development/ai-business-factory-workspace"
IDEAS_PWA_PORT=3002
BMC_PWA_PORT=3001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to kill all development processes
cleanup_processes() {
    log_info "Cleaning up development processes..."
    
    # Kill by process name
    pkill -f "nx serve" 2>/dev/null || true
    pkill -f "vite.*3002" 2>/dev/null || true
    pkill -f "vite.*3001" 2>/dev/null || true
    pkill -f "ai-business-factory" 2>/dev/null || true
    
    # Kill by port (force cleanup)
    lsof -ti:${IDEAS_PWA_PORT} | xargs kill -9 2>/dev/null || true
    lsof -ti:${BMC_PWA_PORT} | xargs kill -9 2>/dev/null || true
    
    # Wait for cleanup
    sleep 2
    
    log_success "Process cleanup complete"
}

# Function to verify ports are free
verify_ports_free() {
    log_info "Verifying ports are available..."
    
    if lsof -i :${IDEAS_PWA_PORT} 2>/dev/null; then
        log_error "Port ${IDEAS_PWA_PORT} is still in use"
        return 1
    fi
    
    if lsof -i :${BMC_PWA_PORT} 2>/dev/null; then
        log_error "Port ${BMC_PWA_PORT} is still in use"
        return 1
    fi
    
    log_success "Ports ${IDEAS_PWA_PORT} and ${BMC_PWA_PORT} are free"
}

# Function to verify TypeScript compilation
verify_build() {
    log_info "Verifying TypeScript compilation..."
    
    cd "${WORKSPACE_ROOT}"
    
    if npm run build:ideas-pwa > /tmp/build-test.log 2>&1; then
        log_success "Build verification passed"
        return 0
    else
        log_error "Build verification failed. Check /tmp/build-test.log for details"
        cat /tmp/build-test.log
        return 1
    fi
}

# Function to start Ideas PWA
start_ideas_pwa() {
    log_info "Starting Ideas PWA on port ${IDEAS_PWA_PORT}..."
    
    cd "${WORKSPACE_ROOT}"
    
    # Set environment variables for AI integration
    export VITE_USE_AI_GENERATION=true
    export VITE_NODE_ENV=development
    
    # Start the server in background
    npm run dev:ideas > /tmp/ideas-pwa.log 2>&1 &
    local pid=$!
    
    log_info "Ideas PWA starting with PID: ${pid}"
    echo ${pid} > /tmp/ideas-pwa.pid
    
    # Wait for server to start
    log_info "Waiting for server to be ready..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if grep -q "Local.*${IDEAS_PWA_PORT}" /tmp/ideas-pwa.log 2>/dev/null; then
            log_success "Ideas PWA is ready at http://localhost:${IDEAS_PWA_PORT}/"
            return 0
        fi
        
        if ! kill -0 ${pid} 2>/dev/null; then
            log_error "Ideas PWA process died. Check /tmp/ideas-pwa.log for details"
            cat /tmp/ideas-pwa.log
            return 1
        fi
        
        sleep 1
        attempts=$((attempts + 1))
        echo -n "."
    done
    
    log_error "Ideas PWA failed to start within ${max_attempts} seconds"
    return 1
}

# Function to start BMC PWA  
start_bmc_pwa() {
    log_info "Starting BMC PWA on port ${BMC_PWA_PORT}..."
    
    cd "${WORKSPACE_ROOT}"
    
    # Start the server in background
    npm run dev:bmc > /tmp/bmc-pwa.log 2>&1 &
    local pid=$!
    
    log_info "BMC PWA starting with PID: ${pid}"
    echo ${pid} > /tmp/bmc-pwa.pid
    
    # Wait for server to start
    log_info "Waiting for server to be ready..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if grep -q "Local.*${BMC_PWA_PORT}" /tmp/bmc-pwa.log 2>/dev/null; then
            log_success "BMC PWA is ready at http://localhost:${BMC_PWA_PORT}/"
            return 0
        fi
        
        if ! kill -0 ${pid} 2>/dev/null; then
            log_error "BMC PWA process died. Check /tmp/bmc-pwa.log for details"
            cat /tmp/bmc-pwa.log
            return 1
        fi
        
        sleep 1
        attempts=$((attempts + 1))
        echo -n "."
    done
    
    log_error "BMC PWA failed to start within ${max_attempts} seconds"
    return 1
}

# Function to check server health
check_health() {
    log_info "Checking server health..."
    
    local ideas_healthy=false
    local bmc_healthy=false
    
    # Check Ideas PWA
    if pgrep -f "nx serve ideas-pwa" > /dev/null; then
        log_success "Ideas PWA process is running"
        ideas_healthy=true
    else
        log_warning "Ideas PWA process not found"
    fi
    
    # Check BMC PWA  
    if pgrep -f "nx serve bmc-pwa" > /dev/null; then
        log_success "BMC PWA process is running"
        bmc_healthy=true
    else
        log_warning "BMC PWA process not found"
    fi
    
    # Overall health status
    if [ "$ideas_healthy" = true ] && [ "$bmc_healthy" = true ]; then
        log_success "All servers are healthy"
        return 0
    else
        log_warning "Some servers may need attention"
        return 1
    fi
}

# Function to show server status
show_status() {
    echo ""
    echo "=== AI Business Factory Development Server Status ==="
    echo ""
    
    # Check processes
    echo "Running Processes:"
    ps aux | grep -E "(nx serve|vite)" | grep -v grep || echo "  No development processes found"
    echo ""
    
    # Check ports
    echo "Port Usage:"
    echo "  Port ${IDEAS_PWA_PORT}: $(lsof -i :${IDEAS_PWA_PORT} 2>/dev/null | grep LISTEN || echo 'Free')"
    echo "  Port ${BMC_PWA_PORT}: $(lsof -i :${BMC_PWA_PORT} 2>/dev/null | grep LISTEN || echo 'Free')"
    echo ""
    
    # Show URLs
    echo "Development URLs:"
    echo "  Ideas PWA: http://localhost:${IDEAS_PWA_PORT}/"
    echo "  BMC PWA:   http://localhost:${BMC_PWA_PORT}/"
    echo ""
    
    # Show logs
    echo "Log Files:"
    echo "  Ideas PWA: /tmp/ideas-pwa.log"
    echo "  BMC PWA:   /tmp/bmc-pwa.log"
    echo ""
}

# Main command processing
case "$1" in
    "start")
        log_info "Starting AI Business Factory development environment..."
        cleanup_processes
        verify_ports_free || exit 1
        verify_build || exit 1
        start_ideas_pwa || exit 1
        echo ""
        log_success "Development environment started successfully!"
        show_status
        ;;
    
    "start-both")
        log_info "Starting both PWA applications..."
        cleanup_processes
        verify_ports_free || exit 1
        verify_build || exit 1
        start_ideas_pwa || exit 1
        start_bmc_pwa || exit 1
        echo ""
        log_success "Both applications started successfully!"
        show_status
        ;;
        
    "stop")
        log_info "Stopping AI Business Factory development environment..."
        cleanup_processes
        rm -f /tmp/ideas-pwa.pid /tmp/bmc-pwa.pid
        log_success "Development environment stopped"
        ;;
        
    "restart")
        log_info "Restarting development environment..."
        "$0" stop
        sleep 2
        "$0" start
        ;;
        
    "status")
        show_status
        check_health
        ;;
        
    "health")
        check_health
        ;;
        
    "logs")
        echo "=== Ideas PWA Logs ==="
        tail -f /tmp/ideas-pwa.log 2>/dev/null || echo "No Ideas PWA logs found"
        ;;
        
    *)
        echo "AI Business Factory Development Server Control"
        echo ""
        echo "Usage: $0 {start|start-both|stop|restart|status|health|logs}"
        echo ""
        echo "Commands:"
        echo "  start      - Start Ideas PWA only"
        echo "  start-both - Start both Ideas PWA and BMC PWA"
        echo "  stop       - Stop all development servers"
        echo "  restart    - Restart development servers"
        echo "  status     - Show detailed server status"
        echo "  health     - Quick health check"
        echo "  logs       - Follow Ideas PWA logs"
        echo ""
        exit 1
        ;;
esac