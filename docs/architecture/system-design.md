# Clinic Management System - System Design

## Overview

The Clinic Management System is a comprehensive web-based application designed to streamline clinic operations through appointment booking, queue management, and administrative functions. The system follows a layered architecture pattern with clear separation of concerns and role-based access control.

## Architecture Overview

The system adopts a **layered architecture** with a Spring Boot backend and Vue.js frontend, providing scalable and maintainable clinic management capabilities. The updated system architecture diagram (`system-architecture-diagram.png`) reflects the following structure.

![System Architecture](system-architecture-diagram.png)

### System Layers

#### 1. Frontend User Interface Layer
Three role-specific experiences deliver the clinic workflows:

- **Patient UI**  
  - Appointment booking  
  - Queue and ticket status tracking  
  
- **Clinic Staff UI**  
  - Appointment management and approvals  
  - Queue orchestration for on-site operations  
  
- **Admin UI**  
  - User account provisioning and oversight  
  - Clinic-wide configuration and policy management  
  
#### 2. Spring Boot Application Entry Point
Central application configuration that enforces security and prepares the REST layer:

- **JWTAuthenticationFilter**: Applies token validation to every protected endpoint  
- **Security Configuration**: Defines role-based access policies and password rules  
- **Role Checks**: Guards controller methods with fine-grained authorisation  
- **JacksonConfig**: Standardises JSON serialisation across services  
  
#### 3. Presentation Layer (Controllers)
REST controllers handle incoming HTTP requests and delegate to the application services:

- **PatientController**: Patient-facing appointment, queue, and ticket flows  
- **StaffController**: Staff tooling for managing clinic queues and schedules  
- **AdminController**: Administrative management of users, clinics, and reporting  
- **Auth endpoints** (within the entry point) expose login and token refresh capabilities  
  
#### 4. Application Layer (Services)
Domain services orchestrate business rules, validation, and transactional workflows:

- **AppointmentService**: Booking windows, validation, and lifecycle updates  
- **ClinicService**: CRUD operations for clinic locations and settings  
- **DoctorService**: Doctor roster management and availability  
- **PatientService**: Patient onboarding, profile, and appointment interactions  
- **PatientQueueService**: Queue aggregation for patient-specific views  
- **ScheduleService**: Doctor schedules, slot assignment, and adjustments  
- **QueueService**: Queue creation, routing, and state transitions  
- **QueueTicketService**: Ticket lifecycle, issuance, and hand-offs  
- **UserService**: Authentication, profile management, password resets  
- **AdminStatisticsService**: Dashboard metrics and historical reporting  
- **UserRoleService**: Role assignment and access management  
- **EmailService**: Asynchronous outbound notifications via external SMTP  
  
#### 5. Data Access Layer
Spring Data JPA repositories abstract persistence for the services:

- **AppointmentRepository**, **ClinicRepository**, **DoctorRepository**, **PatientRepository**  
- **ScheduleRepository**, **QueueRepository**, **QueueTicketRepository**  
- **AdminRepository**, **StaffRepository**, **ProfileRepository**  
- **User-related repositories** supporting authentication and authorisation flows  
  
#### 6. External Integrations

- **Supabase Realtime**: WebSocket-based messaging for instant queue updates between backend and clients  
- **Resend Email API**: Delegated SMTP delivery for patient and staff notification emails  
- **Supabase PostgreSQL**: Managed database hosting for transactional data  

## Key Features

### Real-time Capabilities
- **Supabase Realtime**: Streams queue status and ticket updates to subscribed clients
- **Live Updates**: Bidirectional communication keeps patient and staff views synchronised

### External Integrations
- **Resend Email API**: Automated transactional emails for bookings, reminders, and alerts
- **Supabase Integration**: Cloud-hosted PostgreSQL database with built-in security and realtime messaging
- **SMS API**: Optional text message notifications for critical updates

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

1. **User Authentication**: Users authenticate through dedicated auth endpoints and receive JWT tokens
2. **Request Processing**: Authenticated requests reach the relevant REST controller for each role
3. **Business Logic**: Controllers delegate to application services that enforce business rules
4. **Data Persistence**: Services persist and query information via Spring Data JPA repositories
5. **Real-time Updates**: Supabase Realtime broadcasts queue changes to subscribed clients
6. **External Notifications**: EmailService dispatches confirmation and reminder emails through Resend

## Scalability Considerations

- **Layered Architecture**: Clear separation enables independent scaling of components
- **Service-Oriented Design**: Business logic encapsulated in reusable services
- **Database Optimization**: Efficient queries through Spring Data JPA
- **Real-time Performance**: WebSocket connections for instant updates
- **Cloud Database**: Managed PostgreSQL ensures reliability and performance

This architecture provides a robust foundation for clinic management operations while maintaining flexibility for future enhancements and scaling requirements.

## Backend Class Diagram

The backend class relationships and service boundaries are captured in PlantUML for easy regeneration of the diagram.

![Backend Class Diagram](https://www.plantuml.com/plantuml/png/rLfBSnkv4RxFhq1j3XadiZPdbOfPMd9IJCMM8tbtpz2WII8U0Wm0ok5cDxyzcEaP0cosPc5QILKkV3I-Vk13uu7f-Su7wS9kqrR-apPRwUH6-B1l8NuwtOHCtBJI-tc8uiTTW4LZpOF-2SGVSisrLFQpDYknbAs7hANL1i9-2yAwiBPPmrOsd-GA7dgV3feWpQg5geLb4C4AfrVh89JkMhGrLHLqYC0tKGkC4ZTTJE9MorLdgxwn9ZZRjk3yXNXd5RJn-nwsrkjWdORuxm7Sasx0luekLfs9pbFrtWRPsR-gXFYzsEuUMzq8yLfidNwI0OJuJVnf0pG1b13_7gEEwEjhRGAufMnWDXD_-J1F_lONiHNCRXCRtiOlSBsFg7HZDpscyoX-z_hrXPYlLWvM4YMsbtXl6pr8Ei4jRC4eCCt-IbnUpgAPUv2j_WaXKVJpJ5o8FuC1byHHy-TP5VMmjrKrH2w-QGvSVIF-LGaSNl4Gv7APQEnR8YKh2FFjrceJDc22hvLjOWSNwahyrPhLHLJMHZVfluzqxlnLDETYDhoAOkt3TMPYTh3xqIgvzqVMSsj9kmyjmzs3trhZOSQ6-6P_qrlXZJ6XIAKoOItJxokHDRmw-eUg3dop1hLh8RUW3smO-1o3T-6Zti302KhV6fNBeksnKszDq66FvdTR9KDk-g5djzQ4xkzxt9Lu9xVNWnFycZrZk96cWPQBEIeyMQq6c8Dezsyxs47ju1yxy96IcoIyHrdK6VwYfyEmzD8t-uLAvbbegprYVMstGSU6Y3x8xb0q363KtBNX-iZABAUhRyaeEWGUMIeAN44BrCm9ZzS_H9Pc9pHzr75v2YnPs4Gyev1X8pNwEchiWEOnKUTfmFPfCie28yHWSm4zlnmMcBdQQCCkC0zx7s3JvRRsGJU-VdMKodUFVuScMpVUm-TxM4Kehgg-NjkTYncZJPXMdBSjBWs-7bd4_wSB2iffwXwZyy775Zhk0nw5d3wELjBd1whG4WuFjfGbBdBolGUN6Ed-dVBHIIaRn2wZYDnq3PGP18-z6LGfAwZ9SyBQuFX06-LitFORNEAZ_yymWlB3RhDGTByfqgUSefJBC6oXF0vu57Bwo6NIvzaiiuIC8hASquTXXunKeUP23QS8IjM8PBDeRAGCZF8KUP9G5Z8hF0_5zf0BOgzq9VmWWmOJsBKGAShFCt-oRb38QEDTzIno1wKZ9ZC09JFNnPPJ9tyiNr3vwS8VpeWNRkvma-VNE24scBIC_2AcZDvHZuaAXmdtxeLPsdgB0iOYo-MWdyX4GHf6wcbwHNvU_Tt-wDJzvOcau76tkbb3yoa3dTmD-XjcElQ2KVY7PuAUg8-2vERh_GWjJjjqzEMDyrgKysv7YRpl-Y_iKI7xlrI_PFSmTxWkuZtiS9qKUNyE87BX79QCfJQANrWdxpoeHhUkGhNX5b9wrKEb3-DS8BEYqDlSgCDDwWs4pm261738jxlbqaEubG4wCEOT4Jxlix4x4-wUmBLokurM-QJkRB2Ek8Reh8sg_VZdevmEqeMZt2lWRU0AjPdBmEn4Ow783Q9CwKSTriEW5UYNZNI1OnpeEAv77QKF5ZXJFC55rF8pWRWvZPLCX4psdEAy2Ve9UgalzPhoSae3Kon12o9ait8OlJBQ5cfXQgty470NoeniNZbhpowTUCMNBQlqtkccDl6ZLE73sXgejzrdgSgjVQoLVUpOR6JRpLo-6nwaQzQiYsc5kL8ElAybVayhmJ-Zp3zFrwErBKYJWmbD313pWXmpKjRWUPRrcPuAqMJ1VUT5fXYQEfd4-5oom4D9TlMsc1rm26cyLXyzTopVC3c5UzlTME972cVQzjoeJeT4T25ARM1OWnKIveILCnBlZ2M9OUDhC_23iqlTmWibo63jYDEt6wdR6hhFIPNpPoxrGA7bt92UBWmY3miqujCIFSPEMSKnBIFrlTn0RU87nmuQEfuIi8fjjUk_Q38o-Ba3MSlumMCPsp7xEoNYua8K6a7Hn_qMvm_-vFN88f-eA0trpYbmg3ZtJGafc3J45qaPEfpfple2budHs8pJYTJVoltTyaU0JoT7PpMsN8b5TBu2Dsap6VeYnHzagzNHxLu6O689aEtsKV1Vzp5Xxs1gOJhalJGhu6yUjpHkY8mN-y7Zvy5R7MpizhHgohdpHvbTpAOIZLlgiO3mGWjzR-liJM_Ujhs1iuvGv2c0nx9qNehD2txO-lBLsFzP2RJyKawj5rL0iSHAUadD5DOx-Q9qdDsu09zHdKxFVDD5bOufFfJzqf9XAXLcz_HkJpYpN7X-ZJ3FVOPMGW7R-U8AysHbEStkT74-lxRyjJLbMZATvcOOmCHEmMFXwSV1x8qtTuchB-kHhu6TM_iggtaTnOPssTZuWiDqvPO_a9vJk_twcYrJgvrAZ74dJboSNrVZwsdZyfqANQdczMkrim9Tjax6zpNkctm-bbUe-L7_VwbDKqRmo9DUZ4ZalFoh4-aaazpt5rFYr8DH_NhstWQzr4rlg0xzLd2qBqmiStGd60zkUJCQyKNFa6aItTkMcezDUcMwXjft6pPv9i8VqduhiXgj6j_2q-15TxZphohwqjpbvOmxlLs93iwXaR1I7FQt08r4bY1nwIW0ubfL01odUW6q6oi2g_gKB_5DWTGW3-CxpGFvll1GEbLfjuOHAUaO3nsaFBOu1LaypmSFfJEOLIYWCCwjKV9wbhqvUpJDAgOZf7z9isAc29av57m2om24xwpl6UYOk4Hb1ZaUuZJe6OHIbDEMmL9o8-JaqMV5vo1F6Q_0HybZQQSBi2o9DAMc1uwkxn59QmHLPMm0yMX3i9jgxlrkCvxytq5OMoKy12yUfGSbh17fXUXl_M1rv-KABgl-JV9leI_e2mL1wjQBZNsAUi4AfPTBSB4rsjjA9wDFXI-aNrQ7r-MzM5edG3RhOOFINZXOjlX6kJOYhE5uRv6j0wdseeb-NCGyHjSsT6ZfdFtiBwk85LqNg-_Yhzsc_Gy0)

![Models Class Diagram](https://www.plantuml.com/plantuml/png/jLTTRzis57tNho0oO4kRnEXUXSAe6xj3XdnaST8zqzILJ8GYLV8gWRjcltrNf9fGZ5MlGF8awfn3yjx3Iqhyu91RR6kLkLkf6svvpHnk5327LWgCOA6uSpCaUDKYd0YZb_8hi7TnppKlpBtK5IkvSX0nIch0JGFCM5oRY6YukEKLBFsS5WHoNId8CfH8m4TYGHVip1IWs5pogkkplz14It27R5PL5YgEqcXwkm8LcclPk3UPWghhhA34xDoWf_ACiGFMj2ib1MD7hB7oZYCmzWir3L80K33sx_UuIFt-lTG8jkG2fbFsv-MCfccCasZivf1Oq6rDn88UOFqSrEdOr9t6pyZU7Xt5aH9YFEAS4R97Ec0E3SKBMcnoDfbCCqOpSIM_1Wb1twRiaFq16cmFXvxVfXdr2zbcMHyvswixq_ROFnaBQyTcJMCebneqUfJobqNEJeskmbj3Gn9vCW0B8oZL8IQKr58CCPGrB9L9UllwkYOgPnTbwG3d7A5x3pH5F4wY1UwZNRPrpIsviaGhev6nTKDCT3sWcE7s0Tkc-05zK045l_yc2h-3BeCfMvXvSEOvSHpiUKuilxj1p5W82rtiK2nzvYI8SpzmZyJG6PBT6LcGwE6n4lvgeQKnQNEDLCANJf07NK3uK_7aSIK55lrOvssz0fkp4urGWGrKOwMn4hlLMnixq2-tBI5NQdm5XQaR1JWkq8PckHzZNwC-l4U4HcPrS6GHaObZGN8TcKQQoBQO7rdjXDwztEb2npivPw5aeyKFuuQi-fVKGmhO8TSOcvVYOww5-Jeuj8PsFkKSlVQ93oLVXY5koxxVmDlpRntG3XwMeBPI3972hBfEWgkk8WBMh8s6eOmNXGKtUYQ54KPBBcL7lRlnCISL4Gwa5Q5ne94DuRGY5txgLDUyJf9q3GZ95MwIt0NAEv9-D4O1ro-qttx-Y3sdW2Dh8WS8ucMvkmn-j3MiKV3Qotjbr5W6bzQKKi7_pw5ibJf_jeHGSwcIvRlZoEsDJU0Qa1V4l6ZEd_gWjbJmeeji9Fcm3cdkQPacU_5KwfImaAHZeP96RrlywqsJz3ODw2wPFhVeqwACWwsCDWZfX3MtjoxPLwQr0gwWVEtw6h7-ohimjdN46eeshhnTluW5troKVmFSHj-rv8SmyGbqiHLtok2y3R_MPrAt22uPyuuhMNoofevSY9Xh4-4lSJ3HKA9L18LlzqMvf13zvqfg31BfFlkWZEswxdV3HK6GSjMVax7BiwAMUiVcVfNIY8A8lwPFjviGq-pu-kJpmZSlPpVBnTmtZqylGlCXUyYoty8LARw9iL_PMQjGDaeAVszZznBNp47DDKh1kekXo_oytLs9xVq-cRpT6_oavWnzmsKnUdGq9N6l98t_SNckU3UPa2Y-_UICFxrbCTDDJtFt_mmaVBmJaHco3YbCfzlwz1_OdFNRONUF_aJBcV2Dj4S_O10_RS6SkRxfidu44pJz5uu4tJCba_YIpecBBWjZzHQdeMQFqGJ1pkm_W2xQMlq7)


## API Documentation

- **Swagger UI**: http://localhost:8080/swagger-ui/index.html (interactive documentation for local API exploration)
