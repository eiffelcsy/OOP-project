# Frontend Types Migration to Database Schema

This document outlines the changes made to align frontend types with the backend database schema.

## Overview

The frontend types have been updated to match the database entities exactly, ensuring consistency between frontend and backend data structures.

## Key Changes

### 1. Created Central Types File
- **File**: `frontend/src/types/database.ts`
- **Purpose**: Centralized type definitions matching database schema
- **Benefits**: Single source of truth for data types, better maintainability

### 2. Database Entity Types

#### Core Entities
- `User` - Auth users table
- `PublicUser` - Public users table  
- `Profile` - User profiles
- `Patient` - Patient records
- `Clinic` - Clinic information
- `Doctor` - Doctor records
- `Staff` - Staff records
- `Admin` - Admin records

#### Appointment System
- `Appointment` - Appointment records
- `TimeSlot` - Available time slots
- `Schedule` - Doctor schedules

#### Queue Management
- `Queue` - Daily queues
- `QueueTicket` - Individual queue tickets
- `QueueState` - Queue management state

#### Supporting Entities
- `Room` - Clinic rooms
- `Notification` - System notifications
- `AuditLog` - Audit trail
- `ReportsCache` - Cached reports

### 3. Extended Types for Frontend Use

#### With Relationships
- `AppointmentWithDetails` - Appointment with related data
- `QueueTicketWithDetails` - Queue ticket with related data
- `DoctorWithDetails` - Doctor with clinic and schedules
- `PatientWithDetails` - Patient with profile and appointments
- `ClinicWithDetails` - Clinic with doctors and rooms

#### UI-Specific Types
- `BookingData` - Appointment booking flow
- `WalkInPatientData` - Walk-in patient information
- `WalkInBookingData` - Walk-in booking flow
- `QueueState` - Queue management UI state

### 4. Type Unions and Enums

#### Status Types
- `AppointmentStatus` - All possible appointment statuses
- `QueueTicketStatus` - Queue ticket statuses
- `TimeSlotStatus` - Time slot availability statuses

#### Classification Types
- `UserType` - User role classifications
- `QueuePriority` - Priority levels for queue
- `Region` - Singapore regions
- `ClinicType` - Types of clinics

## Updated Composables

### 1. Appointment Management
- `useBookAppointment.ts` - Updated to use database-aligned Clinic, Doctor, TimeSlot types
- `useScheduleWalkIn.ts` - Updated for walk-in appointment scheduling
- `useViewAppointments.ts` - Updated for viewing appointments
- `useStaffAppointments.ts` - Updated for staff appointment management

### 2. Queue Management
- `useQueueManagement.ts` - Updated to use QueueTicket and QueueState types

### 3. Authentication
- `useAuth.ts` - Complete rewrite with proper User, Profile, Patient, Staff, Admin types

### 4. Dashboard
- `useStaffDashboard.ts` - Updated to use AppointmentStatus types

## Key Differences from Previous Types

### ID Fields
- **Before**: String IDs (`id: string`)
- **After**: Numeric IDs (`id: number`) matching database BIGINT

### Clinic Structure
- **Before**: `{ type, address, region, area }`
- **After**: `{ clinic_type, address_line, region, area }` matching database columns

### Doctor Structure
- **Before**: `{ specialization, clinicId }`
- **After**: `{ specialty, clinic_id }` matching database columns

### Time Slots
- **Before**: `{ startTime, endTime, available }`
- **After**: `{ slot_start, slot_end, status }` matching database columns

### Appointment Status
- **Added**: 'scheduled' status to match common frontend usage
- **Maintained**: All database statuses (booked, confirmed, checked-in, etc.)

## Migration Notes

### Breaking Changes
1. All entity IDs changed from string to number
2. Property names changed to match database column names (snake_case)
3. Status enums updated to match database constraints

### Compatibility
- DateValue types maintained for calendar components
- UI-specific interfaces preserved where needed
- Extended types created for complex frontend requirements

## Usage Examples

### Booking an Appointment
```typescript
import type { Clinic, Doctor, TimeSlot, BookingData } from '@/types/database'

const bookingData: BookingData = {
  clinic: selectedClinic, // Clinic type with id: number
  doctor: selectedDoctor, // Doctor type with clinic_id: number
  date: selectedDate,     // DateValue for calendar
  timeSlot: selectedSlot  // TimeSlot with slot_start/slot_end
}
```

### Queue Management
```typescript
import type { QueueTicket, QueueTicketStatus } from '@/types/database'

const ticket: QueueTicket = {
  id: 1,
  queue_id: 1,
  patient_id: 123,
  ticket_number: 5,
  ticket_status: 'waiting',
  priority: 0,
  // ... other database fields
}
```

### User Authentication
```typescript
import type { AuthUser, Patient, Profile } from '@/types/database'

const user: AuthUser = {
  id: 'uuid-string',
  email: 'user@example.com',
  userType: 'patient',
  profile: profileData,
  patient: patientData
}
```

## Future Considerations

1. **API Integration**: Types are ready for backend API integration
2. **Validation**: Consider adding runtime validation for type safety
3. **Code Generation**: Could generate types from database schema automatically
4. **Documentation**: Keep types documented as database schema evolves

## Files Modified

### New Files
- `frontend/src/types/database.ts` - Central type definitions
- `frontend/src/types/README.md` - This documentation

### Updated Files
- `frontend/src/features/appointments/composables/useBookAppointment.ts`
- `frontend/src/features/appointments/composables/useScheduleWalkIn.ts`
- `frontend/src/features/appointments/composables/useViewAppointments.ts`
- `frontend/src/features/appointments/composables/useStaffAppointments.ts`
- `frontend/src/features/queue/composables/useQueueManagement.ts`
- `frontend/src/features/auth/composables/useAuth.ts`
- `frontend/src/features/dashboard/composables/useStaffDashboard.ts`

The migration ensures type safety and consistency between frontend and backend while maintaining the existing functionality and user experience.
