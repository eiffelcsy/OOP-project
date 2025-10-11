# OOP Project: Clinic Appointment & Queue Management System

A Spring Boot application for managing clinic appointments and queues. Check out [docs](https://github.com/eiffelcsy/OOP-project/tree/main/docs) for comprehensive documentation.

## Prerequisites

- Java 21
- Docker & Docker Compose
- Maven (optional, uses wrapper)

## Local Setup

### 1. Environment Configuration

Create environment files:
- See **.env.backend.example** and **.env.frontend.example** for templates, replace the values for the variables accordingly.

### 2. Development Mode (Recommended for Development)

Development mode enables **hot-reload** - file changes are automatically reflected without rebuilding containers.

**Using start script (Linux/Mac):**
```bash
# Build development containers
./start.sh dev build

# Start services with hot-reload
./start.sh dev up -d

# View logs
./start.sh dev logs -f

# Stop services
./start.sh dev down
```

**Using start script (Windows):**
```cmd
# Build development containers
start.bat dev build

# Start services with hot-reload
start.bat dev up -d

# View logs
start.bat dev logs -f

# Stop services
start.bat dev down
```

**Or directly with docker-compose:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

**Features:**
- ✅ **Automatic code reload** - Changes to source files are instantly reflected
- ✅ **Volume mounts** - Local files synced with containers
- ✅ **Live debugging** - Backend debug port available on 5005
- ✅ **Fast iteration** - No rebuild required for code changes

### 3. Production Mode

Production mode builds optimized containers (no hot-reload, smaller images).

```bash
# Linux/Mac
./start.sh prod build
./start.sh prod up -d

# Windows
start.bat prod build
start.bat prod up -d

# Or directly
docker-compose build
docker-compose up -d
```

## Access

- **Backend API**: http://localhost:8080
- **Frontend**: http://localhost:3000 (or 5173 in dev mode)
- **Health Check**: http://localhost:8080/api/health
- **Backend Debug Port**: 5005 (dev mode only)

## Quick Reference

| Task | Command (Windows) | Command (Linux/Mac) |
|------|-------------------|---------------------|
| Start dev mode | `start.bat dev up -d` | `./start.sh dev up -d` |
| Start prod mode | `start.bat prod up -d` | `./start.sh prod up -d` |
| View logs | `start.bat dev logs -f` | `./start.sh dev logs -f` |
| Stop containers | `start.bat dev down` | `./start.sh dev down` |
| Rebuild | `start.bat dev build` | `./start.sh dev build` |

📖 **For detailed development setup with hot-reload**, see [DEVELOPMENT.md](DEVELOPMENT.md)

## Database

The application uses Supabase PostgreSQL database, which is a managed PostgreSQL database in the cloud. The public connection string and anon key is included in the **.env.backend.example** file, if service role API key is needed, please contact eiffelchong.2023@scis.smu.edu.sg