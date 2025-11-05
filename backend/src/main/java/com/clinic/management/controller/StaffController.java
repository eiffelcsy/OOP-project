package com.clinic.management.controller;

import com.clinic.management.dto.request.CreateQueueRequest;
import com.clinic.management.dto.request.ListQueuesOptions;
import com.clinic.management.dto.request.CreateQueueTicketRequest;
import com.clinic.management.dto.request.UpdateQueueTicketRequest;
import com.clinic.management.dto.request.UpdateQueueRequest;
import com.clinic.management.dto.response.ListResult;
import com.clinic.management.dto.response.QueueResponse;
import com.clinic.management.dto.response.QueueTicketResponse;
import com.clinic.management.dto.response.StaffAppointmentResponse;
import com.clinic.management.model.Appointment;
import com.clinic.management.model.Queue;
import com.clinic.management.model.Patient;
import com.clinic.management.service.AppointmentService;
import com.clinic.management.service.QueueService;
import com.clinic.management.service.QueueTicketService;
import com.clinic.management.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.OffsetDateTime;

/**
 * REST Controller for Staff, Appointment, Queue, and Patient management
 * Provides endpoints for staff-facing operations
 * 
 * Base path: /api
 * 
 * Appointment Endpoints:
 * - GET /api/staff/appointments - View appointments
 * - POST /api/appointments - Schedule walk-in
 * - PUT /api/appointments/{id} - Reschedule appointment
 * - DELETE /api/appointments/{id} - Cancel appointment
 * 
 * Queue Endpoints:
 * - POST /api/queues - Create queue
 * - GET /api/queues/{id} - Get queue by ID
 * - GET /api/queues - List queues (with filters)
 * - PUT /api/queues/{id} - Update queue
 * - DELETE /api/queues/{id} - Delete queue
 * 
 * Patient Endpoints (Staff Access):
 * - GET /api/staff/patients - Get all patients
 * - GET /api/staff/patients/{id} - Get patient by ID
 * 
 * Queue Ticket Endpoints:
 * - POST /api/queue-tickets - Create queue ticket
 * - GET /api/staff/queues/{queueId}/tickets - List queue tickets
 * - PUT /api/queue-tickets/{id} - Update queue ticket
 * - DELETE /api/queue-tickets/{id} - Delete queue ticket
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Configure appropriately for production
@Validated
public class StaffController {

    private final AppointmentService appointmentService;
    private final QueueService queueService;
    private final QueueTicketService queueTicketService;
    private final PatientService patientService;

    @Autowired
    public StaffController(AppointmentService appointmentService, QueueService queueService,
            QueueTicketService queueTicketService, PatientService patientService) {
        this.appointmentService = appointmentService;
        this.queueService = queueService;
        this.queueTicketService = queueTicketService;
        this.patientService = patientService;
    }

    // =========================
    // APPOINTMENT ENDPOINTS
    // =========================

    // # ViewAppointments
    @GetMapping("/staff/appointments")
    public List<Appointment> getAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long clinicId,
            @RequestParam(required = false) String status) {
        return appointmentService.getAppointments(doctorId, clinicId, status);
    }

    /**
     * Get today's appointments for a clinic with enriched data
     * This endpoint returns appointments with patient names, doctor names, clinic info, etc.
     * Filters appointments to only show those scheduled for today (in Asia/Singapore timezone)
     * 
     * GET /api/staff/appointments/today/{clinicId}
     * 
     * @param clinicId Clinic ID
     * @return List of enriched appointments for today
     */
    @GetMapping("/staff/appointments/today/{clinicId}")
    public ResponseEntity<List<StaffAppointmentResponse>> getTodaysAppointments(@PathVariable Long clinicId) {
        List<StaffAppointmentResponse> responses = appointmentService.getTodaysAppointmentsForClinic(clinicId);
        return ResponseEntity.ok(responses);
    }

    // Get appointments for a specific clinic
    @GetMapping("/staff/appointments/clinic/{clinicId}")
    public List<Appointment> getAppointmentsByClinic(@PathVariable Long clinicId) {
        return appointmentService.getAppointments(null, clinicId, null);
    }

    // # ScheduleWalkIn
    @PostMapping("/appointments")
    public ResponseEntity<Appointment> addAppointment(@RequestBody Appointment appointment) {
        // Expect appointment.startTime and appointment.endTime to be provided (ISO
        // timestamptz)
        Appointment saved = appointmentService.addAppointment(appointment);
        boolean queued = appointmentService.isEmailConfigured();
        return ResponseEntity.status(HttpStatus.CREATED).header("X-Email-Queued", String.valueOf(queued)).body(saved);
    }

    // # ManagementAppointments - Reschedule
    @PutMapping("/appointments/{id}")
    public ResponseEntity<?> rescheduleAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) String newStartTime,
            @RequestParam(required = false) String newEndTime) {

        try {
            System.out.println("=== CONTROLLER RESCHEDULE ===");
            System.out.println("Appointment ID: " + id);
            System.out.println("newStartTime: " + newStartTime);
            System.out.println("newEndTime: " + newEndTime);

            if (newStartTime != null && newEndTime != null) {
                // Parse the timestamps - they should be in UTC
                OffsetDateTime start = OffsetDateTime.parse(newStartTime);
                OffsetDateTime end = OffsetDateTime.parse(newEndTime);

                System.out.println("Calling service with timestamps: " + start + " to " + end);

                Appointment updated = appointmentService.rescheduleAppointment(id, start, end);
                return ResponseEntity.ok(updated);
            }

            throw new IllegalArgumentException("newStartTime and newEndTime are required");
        } catch (Exception e) {
            System.out.println("Controller error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to reschedule appointment",
                    "message", e.getMessage()));
        }
    }

    // # ManagementAppointments - Cancel
    @DeleteMapping("/appointments/{id}")
    public void cancelAppointment(@PathVariable Long id) {
        appointmentService.cancelAppointment(id);
    }

    // =========================
    // QUEUE ENDPOINTS
    // =========================

    /**
     * Create a new queue
     * 
     * POST /api/queues
     * 
     * @param request Create queue request (validated)
     * @return Created queue response
     */
    @PostMapping("/queues")
    public ResponseEntity<QueueResponse> createQueue(@Valid @RequestBody CreateQueueRequest request) {
        Queue queue = queueService.createQueue(request);
        QueueResponse response = QueueResponse.from(queue);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get queue by ID
     * 
     * GET /api/queues/{id}
     * 
     * @param id Queue ID
     * @return Queue response if found
     */
    @GetMapping("/queues/{id}")
    public ResponseEntity<QueueResponse> getQueueById(@PathVariable Long id) {
        return queueService.getQueueById(id)
                .map(queue -> ResponseEntity.ok(QueueResponse.from(queue)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * List queues with filtering, pagination, and sorting
     * 
     * GET /api/queues
     * 
     * Query parameters:
     * - page: page number (default 0)
     * - size: page size (default 50)
     * - sortBy: field to sort by (default "created_at")
     * - sortDir: sort direction (ASC or DESC, default DESC)
     * - clinicId: filter by clinic
     * - statuses: filter by statuses (comma-separated)
     * - includeCount: include total count (default false)
     * 
     * @param options List options
     * @return List result with queues and optional count
     */
    @GetMapping("/queues")
    public ResponseEntity<ListResult<QueueResponse>> listQueues(@Valid @ModelAttribute ListQueuesOptions options) {
        ListResult<Queue> result = queueService.listQueues(options);

        // Convert Queue entities to QueueResponse DTOs
        List<QueueResponse> responses = result.getData().stream()
                .map(QueueResponse::from)
                .collect(Collectors.toList());

        ListResult<QueueResponse> responseResult = new ListResult<>(
                responses,
                result.getCount());

        return ResponseEntity.ok(responseResult);
    }

    /**
     * Update an existing queue
     * 
     * PUT /api/queues/{id}
     * 
     * @param id      Queue ID
     * @param request Update request (validated, all fields optional)
     * @return Updated queue response
     */
    @PutMapping("/queues/{id}")
    public ResponseEntity<QueueResponse> updateQueue(
            @PathVariable Long id,
            @Valid @RequestBody UpdateQueueRequest request) {
        Queue queue = queueService.updateQueue(id, request);
        QueueResponse response = QueueResponse.from(queue);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a queue
     * 
     * DELETE /api/queues/{id}
     * 
     * @param id Queue ID
     * @return No content on success
     */
    @DeleteMapping("/queues/{id}")
    public ResponseEntity<Void> deleteQueue(@PathVariable Long id) {
        queueService.deleteQueue(id);
        return ResponseEntity.noContent().build();
    }

    // =========================
    // PATIENT ENDPOINTS (Staff Access)
    // =========================

    /**
     * Get all patients
     * GET /api/staff/patients
     * 
     * Staff-facing endpoint to list all patients in the system
     * Used for appointment scheduling and patient lookup
     */
    @GetMapping("/staff/patients")
    public List<Patient> getAllPatients() {
        return patientService.getAllPatients();
    }

    /**
     * Get patient by ID
     * GET /api/staff/patients/{id}
     * 
     * Staff-facing endpoint to get detailed patient information
     * 
     * @param id Patient ID
     * @return Patient details if found
     */
    @GetMapping("/staff/patients/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================
    // QUEUE TICKET ENDPOINTS
    // =========================

    /**
     * Create a new queue ticket
     * POST /api/queue-tickets
     */
    @PostMapping("/queue-tickets")
    public ResponseEntity<QueueTicketResponse> createQueueTicket(@Valid @RequestBody CreateQueueTicketRequest request) {
        var ticket = queueTicketService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(QueueTicketResponse.from(ticket));
    }

    /**
     * List queue tickets with patient names
     * GET /api/staff/queues/{queueId}/tickets
     */
    @GetMapping("/staff/queues/{queueId}/tickets")
    public ResponseEntity<List<QueueTicketResponse>> listQueueTickets(@PathVariable Long queueId) {
        List<QueueTicketResponse> responses = queueTicketService.listWithPatientNames(queueId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Update queue ticket
     * PUT /api/queue-tickets/{id}
     */
    @PutMapping("/queue-tickets/{id}")
    public ResponseEntity<QueueTicketResponse> updateQueueTicket(@PathVariable Long id,
            @Valid @RequestBody UpdateQueueTicketRequest request) {
        var updated = queueTicketService.update(id, request);
        return ResponseEntity.ok(QueueTicketResponse.from(updated));
    }

    /**
     * Delete queue ticket
     * DELETE /api/queue-tickets/{id}
     */
    @DeleteMapping("/queue-tickets/{id}")
    public ResponseEntity<Void> deleteQueueTicket(@PathVariable Long id) {
        queueTicketService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
