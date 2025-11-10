package com.clinic.management.controller;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.clinic.management.dto.request.CreateAppointmentRequest;
import com.clinic.management.dto.request.RescheduleAppointmentRequest;

import com.clinic.management.dto.response.AppointmentResponse;
import com.clinic.management.dto.response.ClinicResponse;
import com.clinic.management.dto.response.DoctorResponse;
import com.clinic.management.dto.response.PatientQueueResponse;
import com.clinic.management.dto.response.PatientResponse;
import com.clinic.management.dto.response.ScheduleResponse;

import com.clinic.management.model.Appointment;
import com.clinic.management.model.Clinic;
import com.clinic.management.model.Doctor;
import com.clinic.management.model.Patient;
import com.clinic.management.model.Schedule;

import com.clinic.management.service.AppointmentService;
import com.clinic.management.service.ClinicService;
import com.clinic.management.service.DoctorService;
import com.clinic.management.service.PatientQueueService;
import com.clinic.management.service.PatientService;
import com.clinic.management.service.ScheduleService;



/**
 * REST Controller for Patient-facing operations
 * Provides endpoints for patient self-service, appointment management, and clinic information
 * 
 * Base path: /api/patient
 * 
 * Appointment Endpoints:
 * - POST /api/patient/appointments - Book appointment (authenticated patient)
 * - GET /api/patient/appointments - View patient's appointments
 * - PUT /api/patient/appointments/{id} - Reschedule own appointment
 * - DELETE /api/patient/appointments/{id} - Cancel own appointment
 * - GET /api/patient/appointments/debug - Debug appointment scheduling (check overlaps)
 * 
 * Clinic & Doctor Endpoints:
 * - GET /api/patient/clinics - List all clinics
 * - GET /api/patient/doctors/clinic/{clinicId} - Get doctors by clinic
 * 
 * Queue Endpoints:
 * - GET /api/patient/{patientId}/queue - Get patient's current queue information
 * 
 * Patient Profile Endpoints:
 * - GET /api/patient/all - Get all patients
 * - GET /api/patient/{id} - Get patient by ID
 * - GET /api/patient/user/{userId} - Get patient by Supabase user UUID
 */
@RestController
@RequestMapping("/api/patient")
@Validated
public class PatientController {

    private static final Logger log = LoggerFactory.getLogger(PatientController.class);

    private final ClinicService clinicService;
    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final DoctorService doctorService;
    private final PatientQueueService patientQueueService;
    private final ScheduleService scheduleService;

    public PatientController(ClinicService clinicService, PatientService patientService, AppointmentService appointmentService, DoctorService doctorService, PatientQueueService patientQueueService, ScheduleService scheduleService) {
        this.clinicService = clinicService;
        this.patientService = patientService;
        this.appointmentService = appointmentService;
        this.doctorService = doctorService;
        this.patientQueueService = patientQueueService;
        this.scheduleService = scheduleService;
    }

    /**
     * GET /api/patient/doctors/{doctorId}/appointments
     * Fetch upcoming appointments for a doctor that should block patient booking.
     *
     * @param doctorId Doctor ID
     * @return List of appointments (sanitized fields only)
     */
    @Tag(name = "Patient - Appointments", description = "Appointment management endpoints for patients")
    @Operation(summary = "Get doctor appointments", description = "Fetch upcoming appointments for a doctor that should block patient booking")
    @GetMapping("/doctors/{doctorId}/appointments")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointmentsForPatient(@PathVariable Long doctorId) {
        List<Appointment> appointments = appointmentService.getAppointments(doctorId, null, null);
        List<String> blockingStatuses = List.of("scheduled", "confirmed", "checked_in", "completed");

        List<AppointmentResponse> responses = appointments.stream()
            .filter(a -> a.getStatus() != null && blockingStatuses.contains(a.getStatus().toLowerCase()))
            .map(a -> {
                AppointmentResponse resp = new AppointmentResponse();
                resp.id = a.getId();
                resp.doctor_id = a.getDoctorId();
                resp.clinic_id = a.getClinicId();
                resp.start_time = a.getStartTime();
                resp.end_time = a.getEndTime();
                resp.status = a.getStatus();
                resp.created_at = a.getCreatedAt();
                resp.updated_at = a.getUpdatedAt();
                return resp;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * POST /api/patient/appointments
     * Create an appointment on behalf of the authenticated patient.
     * The authenticated user's Supabase UUID will be resolved to a Patient row and
     * set as the appointment.patientId. Returns clearer 400/500 responses for
     * validation and business-rule errors.
     */
    @Tag(name = "Patient - Appointments")
    @Operation(summary = "Create appointment", description = "Create a new appointment for the authenticated patient")
    @PostMapping("/appointments")
    public ResponseEntity<?> createAppointment(@Valid @RequestBody CreateAppointmentRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getPrincipal() == null) {
                log.warn("createAppointment: no authentication principal");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String userId = auth.getPrincipal().toString();
            Optional<com.clinic.management.model.Patient> pOpt = patientService.getPatientByUserId(userId);
            if (pOpt.isEmpty()) {
                log.warn("createAppointment: no patient record for userId={}", userId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "No patient record for user"));
            }

            // Convert DTO to Appointment entity
            Appointment appointment = new Appointment();
            appointment.setPatientId(pOpt.get().getId());
            appointment.setDoctorId(request.getDoctorId());
            appointment.setClinicId(request.getClinicId());
            appointment.setStartTime(request.getStartTime());
            appointment.setEndTime(request.getEndTime());
            appointment.setTreatmentSummary(request.getTreatmentSummary());

            Appointment saved = appointmentService.addAppointment(appointment);
            boolean queued = appointmentService.isEmailConfigured();
            
            AppointmentResponse response = AppointmentResponse.from(saved);
            if (saved.getClinicId() != null) {
                clinicService.getClinicById(saved.getClinicId()).ifPresent(clinic -> {
                    response.clinic_name = clinic.getName();
                    response.clinic_address = clinic.getAddressLine();
                    response.clinic_type = clinic.getClinicType();
                });
            }
            if (saved.getDoctorId() != null) {
                try {
                    Doctor doctor = doctorService.getDoctorById(saved.getDoctorId());
                    if (doctor != null) {
                        response.doctor_name = doctor.getName();
                        response.doctor_specialty = doctor.getSpecialty();
                    }
                } catch (Exception e) {
                    log.warn("createAppointment: failed to load doctor for id {}: {}", saved.getDoctorId(), e.getMessage());
                }
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).header("X-Email-Queued", String.valueOf(queued)).body(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("createAppointment failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid appointment", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("createAppointment unexpected error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    /**
     * GET /api/patient/clinics
     * Fetch all clinics
     * @return List of all clinics as ClinicResponse DTOs
    */
    @Tag(name = "Patient - Clinics & Doctors", description = "Clinic and doctor information endpoints")
    @Operation(summary = "Get all clinics", description = "Retrieve a list of all available clinics")
    @GetMapping("/clinics")
    public List<ClinicResponse> getAllClinics() {
        return clinicService.getAllClinics().stream()
                .map(ClinicResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/patient/doctors/clinic/{clinicId}
     * Fetch doctors by clinic ID for appointment booking
     * @param clinicId Clinic ID
     * @return List of doctors for the specified clinic
     */
    @Tag(name = "Patient - Clinics & Doctors")
    @Operation(summary = "Get doctors by clinic", description = "Fetch doctors available at a specific clinic")
    @GetMapping("/doctors/clinic/{clinicId}")
    public ResponseEntity<List<DoctorResponse>> getDoctorsByClinic(@PathVariable Long clinicId) {
        List<Doctor> doctors = doctorService.getDoctorsByClinicId(clinicId);
        List<DoctorResponse> responses = doctors.stream()
            .map(DoctorResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/patient/doctors/{doctorId}
     * Fetch doctor by ID for appointment booking
     * @param doctorId Doctor ID
     * @return Doctor for the specified ID
     */
    @Tag(name = "Patient - Clinics & Doctors")
    @Operation(summary = "Get doctor by ID", description = "Fetch doctor details by ID for appointment booking")
    @GetMapping("/doctors/{doctorId}")
    public ResponseEntity<DoctorResponse> getDoctorById(@PathVariable Long doctorId) {
        Doctor doctor = doctorService.getDoctorById(doctorId);
        return ResponseEntity.ok(DoctorResponse.from(doctor));
    }

    /**
     * GET /api/patient/doctors/{doctorId}/schedules
     * Fetch schedules for a doctor, filtered to active records.
     *
     * @param doctorId Doctor ID
     * @return List of schedules as ScheduleResponse DTOs
     */
    @Tag(name = "Patient - Schedules", description = "Doctor schedule information endpoints")
    @Operation(summary = "Get doctor schedules", description = "Fetch active schedules for a doctor")
    @GetMapping("/doctors/{doctorId}/schedules")
    public ResponseEntity<List<ScheduleResponse>> getSchedulesForDoctor(@PathVariable Long doctorId) {
        List<Schedule> schedules = scheduleService.getSchedulesByDoctorId(doctorId);
        List<ScheduleResponse> responses = schedules.stream()
            .map(ScheduleResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/patient/{patientId}/queue
     * Get patient's current queue information
     */
    @Tag(name = "Patient - Queue", description = "Queue management endpoints")
    @Operation(summary = "Get patient queue info", description = "Get current queue information for a patient")
    @GetMapping("/{patientId}/queue")
    public ResponseEntity<?> getPatientQueueInfo(@PathVariable Long patientId) {
        try {
            log.info("Received request for patient queue info. PatientId: {}", patientId);
            
            PatientQueueResponse queueInfo = patientQueueService.getPatientQueueInfo(patientId);
            log.info("Queue info retrieved: {}", queueInfo != null ? "found" : "not found");
            
            if (queueInfo == null) {
                return ResponseEntity.ok()
                    .body(Map.of("message", "No active queue tickets found for patient"));
            }
            return ResponseEntity.ok(queueInfo);
        } catch (Exception e) {
            log.error("getPatientQueueInfo: error fetching queue info for patient {}", patientId, e);
            return ResponseEntity.status(500).build();
        }
    }


    /**
     * Get all patients
     */
    @Tag(name = "Patient - Profile", description = "Patient profile management endpoints")
    @Operation(summary = "Get all patients", description = "Retrieve a list of all patients")
    @GetMapping("/all")
    public List<PatientResponse> getAllPatients() {
        return patientService.getAllPatients().stream()
                .map(PatientResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Get a single patient by ID
     */
    @Tag(name = "Patient - Profile")
    @Operation(summary = "Get patient by ID", description = "Retrieve a patient by their ID")
    @GetMapping("/{id}")
    public ResponseEntity<PatientResponse> getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .map(PatientResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/patient/appointments - returns appointments for the logged-in patient
     */
    @Tag(name = "Patient - Appointments")
    @Operation(summary = "Get my appointments", description = "Get all appointments for the authenticated patient")
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getPrincipal() == null) {
                log.warn("getMyAppointments: no authentication principal found");
                return ResponseEntity.status(401).build();
            }

            String userId = auth.getPrincipal().toString();
            log.info("getMyAppointments: authenticated userId={}", userId);

            Optional<com.clinic.management.model.Patient> p = patientService.getPatientByUserId(userId);
            if (p.isEmpty()) {
                log.info("getMyAppointments: no patient row found for userId={}", userId);
                return ResponseEntity.ok(List.of());
            }

            Long patientId = p.get().getId();
            log.info("getMyAppointments: resolved patientId={} for userId={}", patientId, userId);

            List<Appointment> rows = appointmentService.getAppointmentsByPatientId(patientId);
            log.info("getMyAppointments: found {} appointments for patientId={}", rows.size(), patientId);

            // Map to DTO with clinic and doctor details
            List<AppointmentResponse> resp = rows.stream().map(a -> {
                AppointmentResponse ar = new AppointmentResponse();
                ar.id = a.getId();
                ar.patient_id = a.getPatientId();
                ar.doctor_id = a.getDoctorId();
                ar.clinic_id = a.getClinicId();
                ar.start_time = a.getStartTime();
                ar.end_time = a.getEndTime();
                ar.treatment_summary = a.getTreatmentSummary();
                ar.status = a.getStatus();
                ar.created_at = a.getCreatedAt();
                ar.updated_at = a.getUpdatedAt();

                // clinic
                try {
                    if (a.getClinicId() != null) {
                        Clinic c = clinicService.getClinicById(a.getClinicId()).orElse(null);
                        if (c != null) {
                            ar.clinic_name = c.getName();
                            ar.clinic_address = c.getAddressLine();
                            ar.clinic_type = c.getClinicType();
                        }
                    }
                } catch (Exception e) {
                    log.warn("getMyAppointments: failed to load clinic for id {}: {}", a.getClinicId(), e.getMessage());
                }

                // doctor
                try {
                    if (a.getDoctorId() != null) {
                        Doctor d = doctorService.getDoctorById(a.getDoctorId());
                        if (d != null) {
                            ar.doctor_name = d.getName();
                            ar.doctor_specialty = d.getSpecialty();
                        }
                    }
                } catch (Exception e) {
                    log.warn("getMyAppointments: failed to load doctor for id {}: {}", a.getDoctorId(), e.getMessage());
                }

                return ar;
            }).toList();

            log.info("getMyAppointments: returning {} enriched appointment responses", resp.size());
            return ResponseEntity.ok(resp);
        } catch (Exception ex) {
            log.error("getMyAppointments: unexpected error", ex);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * DEBUG: Check schedules and overlaps for a proposed appointment slot
     * GET /api/patient/appointments/debug?doctorId={id}&start={iso}&end={iso}
     */
    @Tag(name = "Patient - Appointments")
    @Operation(summary = "Debug appointment check", description = "Check schedules and overlaps for a proposed appointment slot (debug endpoint)")
    @GetMapping("/appointments/debug")
    public ResponseEntity<?> debugCheckAppointment(@RequestParam Long doctorId, @RequestParam String start, @RequestParam String end) {
        try {
            OffsetDateTime s = OffsetDateTime.parse(start);
            OffsetDateTime e = OffsetDateTime.parse(end);
            Map<String, Object> out = appointmentService.debugCheckAppointment(doctorId, s, e);
            return ResponseEntity.ok(out);
        } catch (Exception ex) {
            log.error("debugCheckAppointment failed", ex);
            return ResponseEntity.badRequest().body(Map.of("error", "invalid parameters", "message", ex.getMessage()));
        }
    }

    /**
     * PUT /api/patient/appointments/{id}
     * Allow the authenticated patient to reschedule their own appointment only.
     */
    @Tag(name = "Patient - Appointments")
    @Operation(summary = "Reschedule appointment", description = "Reschedule an appointment owned by the authenticated patient")
    @PutMapping("/appointments/{id}")
    public ResponseEntity<?> rescheduleMyAppointment(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleAppointmentRequest request) {

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getPrincipal() == null) {
                log.warn("rescheduleMyAppointment: no authentication principal");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String userId = auth.getPrincipal().toString();
            Optional<com.clinic.management.model.Patient> pOpt = patientService.getPatientByUserId(userId);
            if (pOpt.isEmpty()) {
                log.warn("rescheduleMyAppointment: no patient record for userId={}", userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No patient record for user"));
            }

            Long patientId = pOpt.get().getId();

            // Ensure appointment belongs to this patient
            List<Appointment> myAppts = appointmentService.getAppointmentsByPatientId(patientId);
            boolean owns = myAppts.stream().anyMatch(a -> a.getId() != null && a.getId().equals(id));
            if (!owns) {
                log.warn("rescheduleMyAppointment: user {} attempted to reschedule appointment {} not owned by them", userId, id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not allowed to modify this appointment"));
            }

            Appointment updated = appointmentService.rescheduleAppointment(id, request.getNewStartTime(), request.getNewEndTime());
            
            // Convert to response DTO with enriched data
            AppointmentResponse response = AppointmentResponse.from(updated);
            if (updated.getClinicId() != null) {
                clinicService.getClinicById(updated.getClinicId()).ifPresent(clinic -> {
                    response.clinic_name = clinic.getName();
                    response.clinic_address = clinic.getAddressLine();
                    response.clinic_type = clinic.getClinicType();
                });
            }
            if (updated.getDoctorId() != null) {
                try {
                    Doctor doctor = doctorService.getDoctorById(updated.getDoctorId());
                    if (doctor != null) {
                        response.doctor_name = doctor.getName();
                        response.doctor_specialty = doctor.getSpecialty();
                    }
                } catch (Exception e) {
                    log.warn("rescheduleMyAppointment: failed to load doctor for id {}: {}", updated.getDoctorId(), e.getMessage());
                }
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("rescheduleMyAppointment error: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to reschedule appointment",
                    "message", e.getMessage()));
        }
    }

    /**
     * DELETE /api/patient/appointments/{id}
     * Allow the authenticated patient to cancel their own appointment only.
     */
    @Tag(name = "Patient - Appointments")
    @Operation(summary = "Cancel appointment", description = "Cancel an appointment owned by the authenticated patient")
    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<?> cancelMyAppointment(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getPrincipal() == null) {
                log.warn("cancelMyAppointment: no authentication principal");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String userId = auth.getPrincipal().toString();
            Optional<com.clinic.management.model.Patient> pOpt = patientService.getPatientByUserId(userId);
            if (pOpt.isEmpty()) {
                log.warn("cancelMyAppointment: no patient record for userId={}", userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No patient record for user"));
            }

            Long patientId = pOpt.get().getId();

            // Load this patient's appointments and verify ownership of the requested appointment id
            List<Appointment> myAppts = appointmentService.getAppointmentsByPatientId(patientId);
            boolean owns = myAppts.stream().anyMatch(a -> a.getId() != null && a.getId().equals(id));
            if (!owns) {
                log.warn("cancelMyAppointment: user {} attempted to cancel appointment {} not owned by them", userId, id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not allowed to cancel this appointment"));
            }

            // Call existing service method to cancel
            appointmentService.cancelAppointment(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.warn("cancelMyAppointment error: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to cancel appointment",
                    "message", e.getMessage()));
        }
    }

    /**
     * Get a patient by Supabase user UUID
     */
    @Tag(name = "Patient - Profile")
    @Operation(summary = "Get patient by user ID", description = "Retrieve a patient by their Supabase user UUID")
    @GetMapping("/user/{userId}")
    public ResponseEntity<PatientResponse> getPatientByUserId(@PathVariable String userId) {
        return patientService.getPatientByUserId(userId)
                .map(PatientResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

