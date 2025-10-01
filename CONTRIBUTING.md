# Contributing Guide

This README explains how the project is structured, where and how to add code, and how to keep things consistent.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Spring Boot Architecture](#spring-boot-architecture)
- [Coding Conventions](#coding-conventions)
- [Development Workflow](#development-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Common Patterns](#common-patterns)

## Tech Stack

**Backend:**
- **Java 21** - Programming language
- **Spring Boot 3.5.5** - Main framework
- **Spring Security** - Authentication & authorization
- **Spring Data JPA** - Data persistence
- **PostgreSQL** - Primary database
- **Maven** - Dependency management
- **Docker** - Containerization

**Frontend:**
- **Vue** - Frontend Framework

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/clinic/management/
│   │   │   ├── ClinicApplication.java          # Main Spring Boot application
│   │   │   ├── config/                         # Configuration classes
│   │   │   ├── controller/                     # REST API controllers
│   │   │   ├── dto/                            # Data Transfer Objects
│   │   │   │   ├── request/                    # Request DTOs
│   │   │   │   └── response/                   # Response DTOs
│   │   │   ├── exception/                      # Exception handling
│   │   │   │   ├── CustomExceptions.java       # Custom exception classes
│   │   │   │   └── GlobalExceptionHandler.java # Global exception handler
│   │   │   ├── manager/                        # Business logic managers
│   │   │   ├── model/                          # JPA entities
│   │   │   ├── repository/                     # Data access layer (Connects to Supabase)
│   │   │   ├── service/                        # Service layer
│   │   │   └── util/                           # Utility classes
│   │   └── resources/
│   │       └── application.properties          # Application configuration
│   └── test/                                   # Test classes
├── pom.xml                                     # Maven configuration
└── Dockerfile                                  # Docker configuration
```

## Spring Boot Architecture

Our application follows the **layered architecture** pattern, which is the standard approach in Spring Boot applications:

### 1. **Controller Layer** (`controller/`) (equivalent to Router in other frameworks)
- **Purpose**: Handle HTTP requests and responses, define endpoints
- **Responsibilities**: 
  - Receive HTTP requests
  - Validate request parameters
  - Call appropriate service methods
  - Return HTTP responses
- **Annotations**: `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, etc.

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    // Handle authentication endpoints
}
```

### 2. **Manager Layer** (`manager/`)
- **Purpose**: Complex business logic coordination, orchestrates services in the service layer (see below)
- **When to use**: When business logic involves multiple services or complex operations

### 3. **Service Layer** (`service/`)
- **Purpose**: Business logic implementation
- **Responsibilities**:
  - Implement business rules
  - Coordinate between different components
  - Handle transactions
- **Annotations**: `@Service`, `@Transactional`

```java
@Service
@Transactional
public class AuthService {
    // Business logic for authentication
}
```

### 4. **Repository Layer** (`repository/`)
- **Purpose**: Data access and persistence
- **Responsibilities**:
  - Database operations (CRUD)
  - Custom queries
  - Data mapping
- **Annotations**: `@Repository` (extends JpaRepository)

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Data access methods
}
```

### 5. **Model Layer** (`model/`)
- **Purpose**: Entity definitions
- **Responsibilities**:
  - Define database structure
  - Map Java objects to database tables
- **Annotations**: `@Entity`, `@Table`, `@Id`, `@Column`, etc.

```java
@Entity
@Table(name = "users")
public class User {
    // Entity fields and relationships
}
```

### 6. **DTO** (`dto/`)
- **Purpose**: Data transfer between layers
- **Responsibilities**:
  - Request/Response objects
  - Data validation
  - API contracts
- **Annotations**: `@Valid`, validation annotations

## Coding Conventions

### Naming Conventions

1. **Classes**: PascalCase
   - Controllers: `*Controller` (e.g., `AuthController`)
   - Services: `*Service` (e.g., `AuthService`)
   - Repositories: `*Repository` (e.g., `UserRepository`)
   - DTOs: `*Request`, `*Response` (e.g., `LoginRequest`)
   - Entities: Singular nouns (e.g., `User`, `Appointment`)

2. **Methods**: camelCase
   - Use descriptive verbs: `findUserByEmail`, `createAppointment`
   - Repository methods: follow Spring Data naming conventions

3. **Variables**: camelCase
   - Use meaningful names: `userEmail`, `appointmentDate`

4. **Constants**: UPPER_SNAKE_CASE
   ```java
   public static final String DEFAULT_ROLE = "PATIENT";
   ```

### Package Organization

- **Base package**: `com.clinic.management`
- **Follow feature-based organization** when the project grows
- **Keep related classes together**

### Annotation Guidelines

1. **Use appropriate Spring annotations**:
   ```java
   @RestController    // For REST controllers
   @Service          // For service classes
   @Repository       // For repository interfaces
   @Entity           // For JPA entities
   @Configuration    // For configuration classes
   ```

2. **Validation annotations**:
   ```java
   @NotNull
   @NotEmpty
   @Email
   @Size(min = 8, max = 100)
   ```

3. **Transaction management**:
   ```java
   @Transactional    // On service methods that modify data
   ```

## Development Workflow

### 1. Setting Up Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd OOP-project

# Set up environment variables
cp .env.backend.example .env.backend
# Edit .env.backend with your database credentials

# Run with Docker (recommended)
docker-compose up -d

# Or run locally
cd backend
./mvnw spring-boot:run
```

### 2. Adding New Features

**Step-by-step process:**

1. **Create a new branch** (optional):
   ```bash
   git checkout -b feature/appointment-management
   ```

2. **Add the entity** (if needed and not already implemented):
   ```java
   // In model/ directory
   @Entity
   @Table(name = "appointments")
   public class Appointment {
       // Entity definition
   }
   ```

3. **Create the repository** (to link to database):
   ```java
   // In repository/ directory
   public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
       // Custom query methods
   }
   ```

4. **Implement the service** (any logic, CRUD):
   ```java
   // In service/ directory
   @Service
   @Transactional
   public class AppointmentService {
       // Business logic
   }
   ```

5. **Create DTOs** (validation):
   ```java
   // In dto/request/ and dto/response/
   public class CreateAppointmentRequest {
       // Request fields with validation
   }
   ```

6. **Add the controller** (add REST endpoints for your logic, start with this in mind but do this last):
   ```java
   // In controller/ directory
   @RestController
   @RequestMapping("/api/appointments")
   public class AppointmentController {
       // REST endpoints
   }
   ```

8. **Update documentation** if needed

### 3. Database Changes

- Use Hibernate's `spring.jpa.hibernate.ddl-auto=update` for development
- Always test database changes locally first

### 4. Configuration

- **Application properties**: Add new configurations to `application.properties`
- **Security configurations**: Update `SecurityConfig.java`
- **Environment variables**: Add to .env files

## Testing

### Writing Tests

1. **Integration Tests** (Controller layer):
   ```java
   @SpringBootTest
   @AutoConfigureTestDatabase
   @Transactional
   class AuthControllerTest {
       @Autowired
       private MockMvc mockMvc;
       
       @Test
       void shouldRegisterUserSuccessfully() {
           // Test implementation
       }
   }
   ```

### Running Tests
```bash
# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=AuthServiceTest
```

## Common Patterns

### 1. Error Handling
```java
// Custom exceptions
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
}

// Global exception handler
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        // Handle exception
    }
}
```

### 2. DTOs with Validation
```java
public class CreateUserRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
    
    // Getters and setters
}
```

### 3. Service Layer Pattern
```java
@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    public User createUser(CreateUserRequest request) {
        // Validate business rules
        // Transform DTO to entity
        // Save to database
        // Return result
    }
}
```

### 4. Controller Best Practices
```java
@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {
    private final UserService userService;
    
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        User user = userService.createUser(request);
        UserResponse response = UserResponse.from(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
```

## Deployment

- **Development**: Use `docker-compose up`
- **Environment variables**: Ensure all required environment variables are set
