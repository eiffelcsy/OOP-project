package com.clinic.management.service;

// Imported for Email Notification feature
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.clinic.management.repository.QueueTicketRepository;
import com.clinic.management.repository.PatientRepository;
import com.clinic.management.repository.ProfileRepository;
import com.clinic.management.repository.DoctorRepository;
import com.clinic.management.model.Profile;
// Imported for Email Notification feature

import com.clinic.management.dto.request.CreateQueueRequest;
import com.clinic.management.dto.request.ListQueuesOptions;
import com.clinic.management.dto.request.UpdateQueueRequest;
import com.clinic.management.dto.response.ListResult;
import com.clinic.management.exception.CustomExceptions.*;
import com.clinic.management.model.Appointment;
import com.clinic.management.model.Clinic;
import com.clinic.management.model.Doctor;
import com.clinic.management.model.Patient;
import com.clinic.management.model.Queue;
import com.clinic.management.model.QueueTicket;
import com.clinic.management.model.enums.QueueStatus;
import com.clinic.management.repository.ClinicRepository;
import com.clinic.management.repository.QueueRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for Queue management
 * Handles business logic for queue operations
 * 
 * Provides full CRUD operations:
 * - Create queue (with validation)
 * - Get queue by ID
 * - List queues (with filtering, pagination, sorting)
 * - Update queue (with optimistic locking support)
 * - Delete queue
 * 
 * All database operations use Spring Data JPA
 * Transactions managed by Spring @Transactional at method level
 */
@Service
public class QueueService {
    
    private final QueueRepository queueRepository;
    private final ClinicRepository clinicRepository;

    // Added for Email Notification feature
    private static final Logger log = LoggerFactory.getLogger(QueueService.class);
    private final QueueTicketRepository queueTicketRepository;
    private final PatientRepository patientRepository;
    private final ProfileRepository profileRepository;
    private final DoctorRepository doctorRepository;
    private final EmailService emailService;
    // Added for Email Notification feature
    
    @Autowired
    public QueueService(
            QueueRepository queueRepository,
            ClinicRepository clinicRepository,
            QueueTicketRepository queueTicketRepository,
            PatientRepository patientRepository,
            ProfileRepository profileRepository,
            DoctorRepository doctorRepository,
            EmailService emailService) {
        this.queueRepository = queueRepository;
        this.clinicRepository = clinicRepository;
        // Added for Email Notification feature
        this.queueTicketRepository = queueTicketRepository;
        this.patientRepository = patientRepository;
        this.profileRepository = profileRepository;
        this.doctorRepository = doctorRepository;
        this.emailService = emailService;
        // Added for Email Notification feature
    }
    
    /**
     * Create a new queue
     * 
     * @param request Create queue request with validation
     * @return Created queue entity
     * @throws ValidationException if validation fails
     * @throws RepositoryException if database operation fails
     */
    @Transactional
    public Queue createQueue(CreateQueueRequest request) {
        try {
            // Validate clinic exists
            Clinic clinic = clinicRepository.findById(request.getClinicId())
                .orElseThrow(() -> new ValidationException(
                    "Clinic with ID " + request.getClinicId() + " not found"
                ));
            
            // Create new queue
            Queue queue = new Queue();
            queue.setClinic(clinic);
            queue.setQueueStatus(request.getQueueStatus() != null ? 
                request.getQueueStatus() : QueueStatus.ACTIVE);
            
            return queueRepository.save(queue);
            
        } catch (ValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new RepositoryException("Failed to create queue", e);
        }
    }
    
    /**
     * Get queue by ID
     * 
     * @param id Queue ID
     * @return Optional containing the queue if found
     * @throws RepositoryException if database operation fails
     */
    @Transactional(readOnly = true)
    public Optional<Queue> getQueueById(Long id) {
        try {
            return queueRepository.findById(id);
        } catch (Exception e) {
            throw new RepositoryException("Failed to get queue by ID: " + id, e);
        }
    }
    
    /**
     * List queues with filtering, pagination, and sorting
     * 
     * @param options List options (filters, pagination, sorting)
     * @return ListResult containing queues and optional count
     * @throws RepositoryException if database operation fails
     */
    @Transactional(readOnly = true)
    public ListResult<Queue> listQueues(ListQueuesOptions options) {
        try {
            // Build specification for dynamic filtering
            Specification<Queue> spec = buildSpecification(options);
            
            // Build pageable with sorting
            Pageable pageable = buildPageable(options);
            
            // Execute query
            Page<Queue> page = queueRepository.findAll(spec, pageable);
            
            // Build result
            List<Queue> queues = page.getContent();
            Long count = options.isIncludeCount() ? page.getTotalElements() : null;
            
            return new ListResult<>(queues, count);
            
        } catch (Exception e) {
            throw new RepositoryException("Failed to list queues", e);
        }
    }
    
    /**
     * Update an existing queue
     * 
     * @param id Queue ID
     * @param request Update request with optional fields
     * @return Updated queue entity
     * @throws NotFoundException if queue not found
     * @throws OptimisticLockException if optimistic locking fails
     * @throws RepositoryException if database operation fails
     */
    @Transactional
    public Queue updateQueue(Long id, UpdateQueueRequest request) {
        try {
            // Validate at least one field is being updated
            if (!request.hasUpdates()) {
                throw new ValidationException("No fields provided for update");
            }
            
            // Fetch existing queue
            Queue queue = queueRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Queue with ID " + id + " not found"));
            
            // Optimistic locking check
            if (request.getExpectedUpdatedAt().isPresent()) {
                Instant expectedUpdatedAt = request.getExpectedUpdatedAt().get();
                if (!queue.getUpdatedAt().equals(expectedUpdatedAt)) {
                    throw new OptimisticLockException(
                        "Queue has been modified by another process. " +
                        "Expected updatedAt: " + expectedUpdatedAt + 
                        ", actual: " + queue.getUpdatedAt()
                    );
                }
            }
            
            // Update clinic if provided
            if (request.getClinicId().isPresent()) {
                Long clinicId = request.getClinicId().get();
                Clinic clinic = clinicRepository.findById(clinicId)
                    .orElseThrow(() -> new ValidationException(
                        "Clinic with ID " + clinicId + " not found"
                    ));
                queue.setClinic(clinic);
            }
            
            // Update status if provided
            if (request.getQueueStatus().isPresent()) {
                queue.setQueueStatus(request.getQueueStatus().get());
            }
            
            return queueRepository.save(queue);
            
        } catch (NotFoundException | ValidationException | OptimisticLockException e) {
            throw e;
        } catch (Exception e) {
            throw new RepositoryException("Failed to update queue with ID: " + id, e);
        }
    }
    
    /**
     * Delete a queue
     * 
     * @param id Queue ID
     * @throws RepositoryException if database operation fails
     */
    @Transactional
    public void deleteQueue(Long id) {
        try {
            if (!queueRepository.existsById(id)) {
                throw new NotFoundException("Queue with ID " + id + " not found");
            }
            queueRepository.deleteById(id);
        } catch (NotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RepositoryException("Failed to delete queue with ID: " + id, e);
        }
    }
    
    /**
     * Calculate position in queue considering priority
     * @param ticketId The ticket to calculate position for
     * @return Position in queue (1-based), or -1 if ticket not found
     */
    @Transactional(readOnly = true)
    public int calculateQueuePosition(Long ticketId) {
        try {
            QueueTicket ticket = queueTicketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));

            List<QueueTicket> waitingTickets = queueTicketRepository
                .findByQueueAndStatus(ticket.getQueue(), "Checked In"); // Changed from "CHECKED_IN"

            // Split and sort by priority
            List<QueueTicket> fastTrackTickets = waitingTickets.stream()
                .filter(t -> t.getPriority() == 1)
                .sorted((a, b) -> a.getTicketNumber().compareTo(b.getTicketNumber()))
                .toList();

            List<QueueTicket> normalTickets = waitingTickets.stream()
                .filter(t -> t.getPriority() == 0)
                .sorted((a, b) -> a.getTicketNumber().compareTo(b.getTicketNumber()))
                .toList();

            // Combine lists
            List<QueueTicket> orderedTickets = new ArrayList<>();
            orderedTickets.addAll(fastTrackTickets);
            orderedTickets.addAll(normalTickets);

            // Find position (1-based index)
            return orderedTickets.indexOf(ticket) + 1;
        } catch (Exception e) {
            log.error("Error calculating queue position for ticket {}", ticketId, e);
            return -1;
        }
    }

    /**
     * Process email notifications for a queue
     * @param queueId Queue ID to process notifications for
     */
    @Transactional
    public void processQueueNotifications(Long queueId) {
        try {
            Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new NotFoundException("Queue not found"));

            Clinic clinic = queue.getClinic();

            // Get all relevant tickets
            List<QueueTicket> tickets = queueTicketRepository.findByQueue(queue);

            for (QueueTicket ticket : tickets) {
                try {
                    String ticketStatus = ticket.getTicketStatus();
                    if (!"Checked In".equals(ticketStatus) && 
                        !"Called".equals(ticketStatus)) {
                        continue;
                    }

                    // Get patient through appointment
                    Appointment appointment = ticket.getAppointment();
                    if (appointment == null) continue;

                    Long patientId = appointment.getPatientId();
                    if (patientId == null) continue;

                    Patient patient = patientRepository.findById(patientId).orElse(null);
                    if (patient == null) continue;

                    Profile profile = profileRepository.findByUserId(patient.getUserId())
                        .orElse(null);
                    if (profile == null || profile.getEmail() == null) continue;

                    // Check position for Checked In tickets
                    if ("Checked In".equals(ticketStatus)) {
                        int position = calculateQueuePosition(ticket.getId());
                        if (position == 3) {
                            emailService.sendQueueApproachingEmail(
                                profile.getEmail(),
                                profile.getFullName(),
                                ticket.getTicketNumber(),
                                clinic.getName()
                            );
                        }
                    }
                    // Handle Called tickets
                    else if ("Called".equals(ticketStatus)) {
                        Long doctorId = appointment.getDoctorId();
                        Doctor doctor = doctorId != null ? 
                            doctorRepository.findById(doctorId).orElse(null) : null;
                        String doctorName = doctor != null ? doctor.getName() : "your doctor";

                        emailService.sendQueueCalledEmail(
                            profile.getEmail(),
                            profile.getFullName(),
                            doctorName,
                            clinic.getName()
                        );
                    }
                } catch (Exception e) {
                    log.error("Error processing notification for ticket {}", ticket.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process queue notifications for queue {}", queueId, e);
        }
    }



    // ==================== Helper Methods ====================
    
    /**
     * Build JPA Specification for dynamic filtering
     */
    private Specification<Queue> buildSpecification(ListQueuesOptions options) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filter by clinic ID
            if (options.getClinicId() != null) {
                predicates.add(criteriaBuilder.equal(
                    root.get("clinic").get("id"), 
                    options.getClinicId()
                ));
            }
            
            // Filter by statuses
            if (options.getStatuses() != null && !options.getStatuses().isEmpty()) {
                predicates.add(root.get("queueStatus").in(options.getStatuses()));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Build Pageable with sorting
     */
    private Pageable buildPageable(ListQueuesOptions options) {
        Sort sort = Sort.by(
            options.getSortDir() == ListQueuesOptions.SortDirection.ASC ? 
                Sort.Direction.ASC : Sort.Direction.DESC,
            convertSortField(options.getSortBy())
        );
        
        return PageRequest.of(options.getPage(), options.getSize(), sort);
    }
    
    /**
     * Convert snake_case DB field names to camelCase entity field names
     */
    private String convertSortField(String sortBy) {
        return switch (sortBy.toLowerCase()) {
            case "created_at" -> "createdAt";
            case "updated_at" -> "updatedAt";
            case "id" -> "id";
            default -> "createdAt"; // safe default
        };
    }
}
