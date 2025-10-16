#!/bin/bash
# start.sh - Enhanced script with development mode support

# Function to show usage
show_usage() {
    echo "Usage: ./start.sh [MODE] [COMMAND]"
    echo ""
    echo "Modes:"
    echo "  dev     - Development mode with hot-reload (default)"
    echo "  prod    - Production mode"
    echo ""
    echo "Commands:"
    echo "  build   - Build containers"
    echo "  up      - Start containers (add -d for detached mode)"
    echo "  down    - Stop and remove containers"
    echo "  logs    - View container logs (add -f to follow)"
    echo "  restart - Restart containers"
    echo ""
    echo "Examples:"
    echo "  ./start.sh dev up -d        # Start development mode in background"
    echo "  ./start.sh prod build       # Build production containers"
    echo "  ./start.sh dev logs -f      # Follow development logs"
    echo ""
}

# Load environment variables and export them (support both frontend and backend env files)
# This ensures docker-compose substitution can read VITE_* values when using this script.
set -a
if [ -f .env.frontend ]; then
    echo "Sourcing .env.frontend"
    source .env.frontend
fi
if [ -f .env.backend ]; then
    echo "Sourcing .env.backend"
    source .env.backend
fi
set +a

# Default to development mode
MODE="dev"
COMPOSE_FILE="docker-compose.dev.yml"

# Parse arguments
if [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_usage
    exit 0
fi

# Check if first argument is a mode
if [ "$1" = "dev" ] || [ "$1" = "prod" ]; then
    MODE=$1
    shift
    
    if [ "$MODE" = "prod" ]; then
        COMPOSE_FILE="docker-compose.yml"
    fi
fi

# If no command provided after mode, show usage
if [ -z "$1" ]; then
    show_usage
    exit 1
fi

echo "Running in $MODE mode..."
echo "Using compose file: $COMPOSE_FILE"
echo ""

# Run docker-compose with the selected file and remaining arguments
docker-compose -f "$COMPOSE_FILE" "$@"
