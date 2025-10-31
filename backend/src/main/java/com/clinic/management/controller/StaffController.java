package com.clinic.management.controller;

import com.clinic.management.dto.request.CreateQueueRequest;
import com.clinic.management.dto.request.ListQueuesOptions;
import com.clinic.management.dto.request.CreateQueueTicketRequest;
import com.clinic.management.dto.request.UpdateQueueTicketRequest;
import com.clinic.management.dto.request.UpdateQueueRequest;
import com.clinic.management.dto.response.ListResult;
import com.clinic.management.dto.response.QueueResponse;
import com.clinic.management.dto.response.QueueTicketResponse;
import com.clinic.management.model.Appointment;
import com.clinic.management.model.Queue;
import com.clinic.management.model.QueueTicket;
import com.clinic.management.model.Patient;
import com.clinic.management.model.Profile;
import com.clinic.management.repository.ProfileRepository;
import com.clinic.management.repository.PatientRepository;
import com.clinic.management.service.AppointmentService;
import com.clinic.management.service.QueueService;
import com.clinic.management.service.QueueTicketService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.OffsetDateTime;

/**
 * REST Controller for Staff, Appointment, and Queue management
 * Provides endpoints for appointment and queue CRUD operations
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
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Configure appropriately for production
@Validated
public class StaffController {

    private final AppointmentService appointmentService;
    private final QueueService queueService;
    private final QueueTicketService queueTicketService;
    private final ProfileRepository profileRepository;
    private final PatientRepository patientRepository;

    @Autowired
    public StaffController(AppointmentService appointmentService, QueueService queueService, QueueTicketService queueTicketService, ProfileRepository profileRepository, PatientRepository patientRepository) {
        this.appointmentService = appointmentService;
        this.queueService = queueService;
        this.queueTicketService = queueTicketService;
        this.profileRepository = profileRepository;
        this.patientRepository = patientRepository;
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

    // Get appointments for a specific clinic
    @GetMapping("/staff/appointments/clinic/{clinicId}")
    public List<Appointment> getAppointmentsByClinic(@PathVariable Long clinicId) {
        return appointmentService.getAppointments(null, clinicId, null);
    }

    // # ScheduleWalkIn
    @PostMapping("/appointments")
    public Appointment addAppointment(@RequestBody Appointment appointment) {
        // Expect appointment.startTime and appointment.endTime to be provided (ISO
        // timestamptz)
        return appointmentService.addAppointment(appointment);
    }

    // # ManagementAppointments - Reschedule
    @PutMapping("/appointments/{id}")
    public Appointment rescheduleAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) Long newTimeSlotId,
            @RequestParam(required = false) String newStartTime,
            @RequestParam(required = false) String newEndTime) {
        if (newStartTime != null && newEndTime != null) {
            OffsetDateTime s = OffsetDateTime.parse(newStartTime);
            OffsetDateTime e = OffsetDateTime.parse(newEndTime);
            return appointmentService.rescheduleAppointment(id, s, e);
        }
        if (newTimeSlotId != null) {
            return appointmentService.rescheduleAppointment(id, newTimeSlotId);
        }
        throw new IllegalArgumentException("Provide either newTimeSlotId or newStartTime and newEndTime");
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
        List<QueueTicket> tickets = queueTicketService.list(queueId);
        
    // Collect patient IDs via appointment.patientId then resolve to user IDs
    List<Long> patientIds = tickets.stream()
        .map(QueueTicket::getAppointment)
        .filter(Objects::nonNull)
        .map(Appointment::getPatientId)
        .filter(Objects::nonNull)
        .distinct()
        .collect(Collectors.toList());

    Map<Long, String> patientIdToUserId = patientRepository.findByIdIn(patientIds).stream()
        .filter(p -> p.getUserId() != null)
        .collect(Collectors.toMap(Patient::getId, Patient::getUserId));

    List<String> userIds = patientIds.stream()
        .map(patientIdToUserId::get)
        .filter(Objects::nonNull)
        .distinct()
        .collect(Collectors.toList());
        
        // Fetch all profiles in one query
        Map<String, String> userIdToNameMap = profileRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(Profile::getUserId, Profile::getFullName));
        
        // Convert tickets to responses and enrich with patient names
        List<QueueTicketResponse> responses = tickets.stream()
                .map(ticket -> {
                    QueueTicketResponse response = QueueTicketResponse.from(ticket);
                    // Enrich patient name via appointment.patientId -> patient.userId -> profiles
                    if (ticket.getAppointment() != null && ticket.getAppointment().getPatientId() != null) {
                        Long pid = ticket.getAppointment().getPatientId();
                        String uid = patientIdToUserId.get(pid);
                        if (uid != null) {
                            String patientName = userIdToNameMap.get(uid);
                            response.setPatientName(patientName != null ? patientName : (pid != null ? "Patient #" + pid : "Walk-in"));
                        } else {
                            response.setPatientName(pid != null ? "Patient #" + pid : "Walk-in");
                        }
                    } else {
                        response.setPatientName("Walk-in");
                    }
                    return response;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    /**
     * Update queue ticket
     * PUT /api/queue-tickets/{id}
     */
    @PutMapping("/queue-tickets/{id}")
    public ResponseEntity<QueueTicketResponse> updateQueueTicket(@PathVariable Long id, @Valid @RequestBody UpdateQueueTicketRequest request) {
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
