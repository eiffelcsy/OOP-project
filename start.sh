#!/bin/bash
# start.sh

# Load environment variables and export them
set -a
source .env.frontend
set +a

# Run docker-compose with all arguments passed to the script
docker-compose "$@"