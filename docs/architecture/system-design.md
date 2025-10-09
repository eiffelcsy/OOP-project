# Clinic Management System - System Design

## Overview

The Clinic Management System is a comprehensive web-based application designed to streamline clinic operations through appointment booking, queue management, and administrative functions. The system follows a layered architecture pattern with clear separation of concerns and role-based access control.

## Architecture Overview

The system is built using a **4-layer architecture** with Spring Boot backend and Vue.js frontend, providing scalable and maintainable clinic management capabilities.

### System Layers

#### 1. Presentation Layer
The frontend provides three distinct user interfaces:

- **Patient UI**: 
  - Appointment booking functionality
  - Queue management and status tracking
  
- **Clinic Staff UI**:
  - Appointment management for staff
  - Queue control and patient flow management
  
- **Admin UI**:
  - User account management
  - Clinic configuration and settings

#### 2. Application Entry Point (Spring Boot)
- **JWT Authentication Filter**: Secures API endpoints with token-based authentication
- **Security Configuration**: Implements role-based access control
- **Role Checks**: Ensures users can only access authorized resources

#### 3. Controller Layer (REST API)
The system exposes RESTful APIs through specialized controllers:

- **UserController**: Handles user details fetching and authorization validation
- **PatientController**: Manages patient-related operations
- **StaffController**: Handles staff-specific functionalities  
- **AdminController**: Provides administrative operations

#### 4. Application Layer (Orchestration)
Business logic orchestration through dedicated managers:

- **AuthManager**: 
  - User registration and login
  - Session management and logout
  
- **PatientManager**:
  - Patient appointment CRUD operations
  - Queue operations for patients
  - Patient notifications
  
- **StaffManager**:
  - Staff appointment management
  - Queue control operations
  - Real-time queue management
  
- **AdminManager**:
  - User account administration
  - Clinic configuration management
  - Doctor and staff management

#### 5. Service Layer (Business Logic)
Core business services implementing domain logic:

- **UserService**: User authentication, lifecycle, profile, and permission management
- **QueueService**: Queue initialization, entry management, processing logic, and real-time state management
- **AppointmentService**: Appointment creation, validation, availability management, and business rules
- **DoctorService**: Doctor creation and management
- **ClinicService**: Clinic configuration and management
- **ScheduleService**: Doctor schedule and time slot management
- **NotificationService**: Multi-channel notification delivery (Email, SMS, in-app)

#### 6. Data Layer
- **Spring Data JPA Repositories**: Connected to Supabase PostgreSQL database
- **Database**: Managed PostgreSQL instance with comprehensive clinic data storage

## Key Features

### Real-time Capabilities
- **WebSocket Handler**: Provides real-time queue updates, live status tracking, and instant patient notifications
- **Live Updates**: Seamless communication between frontend and backend for queue status changes

### External Integrations
- **Email API**: Automated email notifications for appointments and updates
- **SMS API**: Text message notifications for critical updates
- **Supabase Integration**: Cloud-hosted PostgreSQL database with built-in security

### Security Features
- JWT-based authentication with role-based authorization
- Secure API endpoints with proper access controls
- User session management and validation

### Multi-Role Support
The system supports three distinct user roles:
1. **Patients**: Book appointments, view queue status
2. **Staff**: Manage appointments, control patient flow
3. **Administrators**: Full system configuration and user management

## Technology Stack

### Backend
- **Framework**: Spring Boot
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT tokens via Supabase Auth
- **Real-time**: WebSocket
- **Build Tool**: Maven

### Frontend  
- **Framework**: Vue.js
- **UI Components**: Custom component library
- **State Management**: Composables pattern
- **Routing**: Vue Router

### Infrastructure
- **Database**: Supabase PostgreSQL
- **Containerization**: Docker & Docker Compose
- **External APIs**: Email and SMS services

## Data Flow

1. **User Authentication**: Users authenticate through the AuthController, receiving JWT tokens
2. **Request Processing**: Authenticated requests flow through appropriate controllers to managers
3. **Business Logic**: Managers orchestrate service calls to implement business requirements
4. **Data Persistence**: Services interact with repositories for data operations
5. **Real-time Updates**: WebSocket handler broadcasts live updates to connected clients
6. **External Notifications**: NotificationService triggers email/SMS for important events

## Scalability Considerations

- **Layered Architecture**: Clear separation enables independent scaling of components
- **Service-Oriented Design**: Business logic encapsulated in reusable services
- **Database Optimization**: Efficient queries through Spring Data JPA
- **Real-time Performance**: WebSocket connections for instant updates
- **Cloud Database**: Managed PostgreSQL ensures reliability and performance

This architecture provides a robust foundation for clinic management operations while maintaining flexibility for future enhancements and scaling requirements.
