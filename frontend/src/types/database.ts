// Database entity types matching the backend schema
// These types correspond directly to the database tables

// Base user type from auth.users table
export interface User {
  id: string // UUID from auth.users
  email: string
  // Add other auth.users fields as needed
}

// Users table (public.users)
export interface PublicUser {
  id: number // bigint GENERATED ALWAYS AS IDENTITY
  user_type: string
  display_name: string
  email: string
  enabled: boolean
  password: string // Note: This should never be exposed to frontend in real app
}

// Profiles table
export interface Profile {
  id: number
  user_id: string // UUID reference to auth.users
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

// Patients table
export interface Patient {
  id: number
  user_id: string | null // UUID reference to auth.users
  nric: string | null
  phone: string | null
  address: string | null
  dob: string | null // timestamp with time zone
  created_at: string
  updated_at: string
}

// Clinics table
export interface Clinic {
  id: number
  clinic_type: string | null
  name: string
  address_line: string | null
  region: string | null
  area: string | null
  source_ref: string | null
  remarks: string | null
  created_at: string
  updated_at: string
  day_type: string | null
  day_of_week: number | null // smallint
  open_time: string | null // time without time zone
  close_time: string | null // time without time zone
  note: string | null
}

// Doctors table
export interface Doctor {
  id: number
  clinic_id: number
  name: string
  specialty: string | null
  active: boolean
  created_at: string
  updated_at: string
}

// Staff table
export interface Staff {
  id: number
  user_id: string | null // UUID reference to auth.users
  clinic_id: number | null
  role: string | null
  created_at: string
  updated_at: string
}

// Admins table
export interface Admin {
  id: number
  user_id: string // UUID reference to auth.users
  created_at: string
  updated_at: string
}

// Rooms table
export interface Room {
  id: number
  clinic_id: number
  name: string
  created_at: string
  updated_at: string
}

// Schedules table
export interface Schedule {
  id: number
  doctor_id: number
  day_of_week: number // smallint (0-6, where 0 is Sunday)
  start_time: string // time without time zone
  end_time: string // time without time zone
  slot_duration_minutes: number
  valid_from: string | null // timestamp with time zone
  valid_to: string | null // timestamp with time zone
  created_at: string
  updated_at: string
}

// Time slots table
export interface TimeSlot {
  id: number
  doctor_id: number
  clinic_id: number
  slot_start: string // timestamp with time zone
  slot_end: string // timestamp with time zone
  status: 'available' | 'booked' | 'blocked' | string // Default 'available'
  created_at: string
  updated_at: string
}

// Appointments table
export interface Appointment {
  id: number
  patient_id: number
  doctor_id: number | null
  clinic_id: number | null
  time_slot_id: number | null
  treatment_summary: string | null
  status: 'booked' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | string
  created_at: string
  updated_at: string
}

// Queues table
export interface Queue {
  id: number
  clinic_id: number
  queue_date: string // timestamp with time zone
  queue_status: string | null
  created_at: string
  updated_at: string
}

// Queue tickets table
export interface QueueTicket {
  id: number
  queue_id: number
  appointment_id: number | null
  patient_id: number | null
  ticket_number: number
  priority: number // smallint, default 0
  ticket_status: 'waiting' | 'called' | 'in-progress' | 'completed' | 'no-show' | string
  called_at: string | null // timestamp with time zone
  completed_at: string | null // timestamp with time zone
  no_show_at: string | null // timestamp with time zone
  created_at: string
  updated_at: string
}

// Notifications table
export interface Notification {
  id: number
  user_id: string | null // UUID reference to auth.users
  channel: string | null
  template_key: string | null
  payload_json: Record<string, any> | null
  delivered_at: string | null // timestamp with time zone
  created_at: string
}

// Audit logs table
export interface AuditLog {
  id: number
  user_id: string | null // UUID reference to auth.users
  action: string
  entity_type: string | null
  entity_id: string | null
  data_json: Record<string, any> | null
  created_at: string
}

// Reports cache table
export interface ReportsCache {
  id: number
  report_date: string // timestamp with time zone
  clinic_id: number | null
  patients_seen: number
  avg_wait_secs: number | null
  no_show_rate: number | null // numeric
  created_at: string
  updated_at: string
}

// Extended types with relationships for frontend use
export interface AppointmentWithDetails extends Appointment {
  patient?: Patient
  doctor?: Doctor
  clinic?: Clinic
  time_slot?: TimeSlot
  queue_ticket?: QueueTicket
}

export interface QueueTicketWithDetails extends QueueTicket {
  appointment?: Appointment
  patient?: Patient
  queue?: Queue
}

export interface DoctorWithDetails extends Doctor {
  clinic?: Clinic
  schedules?: Schedule[]
}

export interface PatientWithDetails extends Patient {
  profile?: Profile
  appointments?: Appointment[]
}

export interface ClinicWithDetails extends Clinic {
  doctors?: Doctor[]
  rooms?: Room[]
}

// Frontend-specific types for UI components
export interface BookingData {
  clinic: Clinic | null
  doctor: Doctor | null
  date: any | null // DateValue from @internationalized/date or string
  timeSlot: TimeSlot | null
}

export interface WalkInPatientData {
  name: string
  phone: string
  nric?: string
  email?: string
  dateOfBirth?: string
  emergencyContact?: string
}

export interface WalkInBookingData {
  patient: WalkInPatientData | null
  doctor: Doctor | null
  date: any | null // DateValue from @internationalized/date or string
  timeSlot: TimeSlot | null
  appointmentType: string
  notes?: string
  urgency: 'normal' | 'urgent' | 'emergency'
}

// Queue management types
export interface QueueState {
  isActive: boolean
  isPaused: boolean
  currentNumber: number
  totalServed: number
  averageWaitTime: number
  queueId: number | null
  startedAt: Date | null
  endedAt: Date | null
}

// Priority levels for queue tickets
export type QueuePriority = 'normal' | 'urgent' | 'emergency' | 'elderly' | 'fast-track'

// Appointment status types
export type AppointmentStatus = 'booked' | 'confirmed' | 'scheduled' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'

// Queue ticket status types  
export type QueueTicketStatus = 'waiting' | 'called' | 'checked-in' | 'in-progress' | 'completed' | 'no-show'

// Time slot status types
export type TimeSlotStatus = 'available' | 'booked' | 'blocked'

// User types
export type UserType = 'patient' | 'staff' | 'admin' | 'doctor'

// Region types for Singapore
export type Region = 'Central' | 'West' | 'East' | 'North-East' | 'North'

// Clinic types
export type ClinicType = 'General' | 'Specialist' | 'Emergency' | 'Polyclinic'
