package com.clinic.management.controller;

import com.clinic.management.dto.request.CreateQueueRequest;
import com.clinic.management.dto.request.ListQueuesOptions;
import com.clinic.management.dto.request.UpdateQueueRequest;
import com.clinic.management.dto.response.ListResult;
import com.clinic.management.dto.response.QueueResponse;
import com.clinic.management.model.Queue;
import com.clinic.management.service.QueueService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for Queue management
 * Provides endpoints for queue CRUD operations
 * 
 * Base path: /api/queues
 * 
 * Endpoints:
 * - POST   /api/queues              - Create queue
 * - GET    /api/queues/{id}         - Get queue by ID
 * - GET    /api/queues              - List queues (with filters)
 * - PUT    /api/queues/{id}         - Update queue
 * - DELETE /api/queues/{id}         - Delete queue
 */
@RestController
@RequestMapping("/api/queues")
@Validated
public class QueueController {
    
    private final QueueService queueService;
    
    @Autowired
    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }
    
    /**
     * Create a new queue
     * 
     * POST /api/queues
     * 
     * @param request Create queue request (validated)
     * @return Created queue response
     */
    @PostMapping
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
    @GetMapping("/{id}")
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
    @GetMapping
    public ResponseEntity<ListResult<QueueResponse>> listQueues(@Valid @ModelAttribute ListQueuesOptions options) {
        ListResult<Queue> result = queueService.listQueues(options);
        
        // Convert Queue entities to QueueResponse DTOs
        List<QueueResponse> responses = result.getData().stream()
            .map(QueueResponse::from)
            .collect(Collectors.toList());
        
        ListResult<QueueResponse> responseResult = new ListResult<>(
            responses,
            result.getCount().orElse(null)
        );
        
        return ResponseEntity.ok(responseResult);
    }
    
    /**
     * Update an existing queue
     * 
     * PUT /api/queues/{id}
     * 
     * @param id Queue ID
     * @param request Update request (validated, all fields optional)
     * @return Updated queue response
     */
    @PutMapping("/{id}")
    public ResponseEntity<QueueResponse> updateQueue(
        @PathVariable Long id,
        @Valid @RequestBody UpdateQueueRequest request
    ) {
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
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQueue(@PathVariable Long id) {
        queueService.deleteQueue(id);
        return ResponseEntity.noContent().build();
    }
}
