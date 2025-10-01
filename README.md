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

### 2. Run with Docker

```bash
# Build containers
docker compose build

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Access

- **Backend API**: http://localhost:8080
- **Frontend**: http://localhost:3000
- **Health Check**: http://localhost:8080/health

## Database

The application uses Supabase PostgreSQL database, which is a managed PostgreSQL database in the cloud. The public connection string and anon key is included in the **.env.backend.example** file, if service role API key is needed, please contact eiffelchong.2023@scis.smu.edu.sg