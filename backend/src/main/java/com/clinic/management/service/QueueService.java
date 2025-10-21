package com.clinic.management.service;

import com.clinic.management.dto.request.CreateQueueRequest;
import com.clinic.management.dto.request.ListQueuesOptions;
import com.clinic.management.dto.request.UpdateQueueRequest;
import com.clinic.management.dto.response.ListResult;
import com.clinic.management.exception.CustomExceptions.*;
import com.clinic.management.model.Clinic;
import com.clinic.management.model.Queue;
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
    
    @Autowired
    public QueueService(QueueRepository queueRepository, ClinicRepository clinicRepository) {
        this.queueRepository = queueRepository;
        this.clinicRepository = clinicRepository;
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
