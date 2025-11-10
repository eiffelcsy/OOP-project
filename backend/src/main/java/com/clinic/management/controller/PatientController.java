package com.clinic.management.controller;

import com.clinic.management.model.Clinic;
import com.clinic.management.model.Patient;
import com.clinic.management.service.PatientService;
import com.clinic.management.dto.response.ClinicResponse;
import com.clinic.management.dto.response.PatientQueueResponse;
import com.clinic.management.service.ClinicService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.time.OffsetDateTime;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.clinic.management.model.Appointment;
import com.clinic.management.service.AppointmentService;
import com.clinic.management.service.DoctorService;
import com.clinic.management.service.PatientQueueService;
import com.clinic.management.service.ScheduleService;
import com.clinic.management.dto.response.AppointmentResponse;
import com.clinic.management.dto.response.DoctorResponse;
import com.clinic.management.model.Doctor;
import com.clinic.management.model.Schedule;
import com.clinic.management.dto.response.ScheduleResponse;



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
    @PostMapping("/appointments")
    public ResponseEntity<?> createAppointment(@RequestBody Appointment appointment) {
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

            // Ensure the appointment is associated with the authenticated patient
            appointment.setPatientId(pOpt.get().getId());

            Appointment saved = appointmentService.addAppointment(appointment);
            boolean queued = appointmentService.isEmailConfigured();
            return ResponseEntity.status(HttpStatus.CREATED).header("X-Email-Queued", String.valueOf(queued)).body(saved);
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
    @GetMapping("/doctors/clinic/{clinicId}")
    public ResponseEntity<List<com.clinic.management.dto.response.DoctorResponse>> getDoctorsByClinic(@PathVariable Long clinicId) {
        List<Doctor> doctors = doctorService.getDoctorsByClinicId(clinicId);
        List<com.clinic.management.dto.response.DoctorResponse> responses = doctors.stream()
            .map(com.clinic.management.dto.response.DoctorResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/patient/doctors/{doctorId}
     * Fetch doctor by ID for appointment booking
     * @param doctorId Doctor ID
     * @return Doctor for the specified ID
     */
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
    @GetMapping("/all")
    public List<Patient> getAllPatients() {
        return patientService.getAllPatients();
    }

    /**
     * Get a single patient by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/patient/appointments - returns appointments for the logged-in patient
     */
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
    @PutMapping("/appointments/{id}")
    public ResponseEntity<?> rescheduleMyAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) String newStartTime,
            @RequestParam(required = false) String newEndTime) {

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

            if (newStartTime != null && newEndTime != null) {
                OffsetDateTime start = OffsetDateTime.parse(newStartTime);
                OffsetDateTime end = OffsetDateTime.parse(newEndTime);

                // Ensure appointment belongs to this patient
                List<Appointment> myAppts = appointmentService.getAppointmentsByPatientId(patientId);
                boolean owns = myAppts.stream().anyMatch(a -> a.getId() != null && a.getId().equals(id));
                if (!owns) {
                    log.warn("rescheduleMyAppointment: user {} attempted to reschedule appointment {} not owned by them", userId, id);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not allowed to modify this appointment"));
                }

                Appointment updated = appointmentService.rescheduleAppointment(id, start, end);
                return ResponseEntity.ok(updated);
            }

            throw new IllegalArgumentException("newStartTime and newEndTime are required");
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
    @GetMapping("/user/{userId}")
    public ResponseEntity<Patient> getPatientByUserId(@PathVariable String userId) {
        return patientService.getPatientByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

