package com.clinic.management.dto.response;

import com.clinic.management.model.Queue;
import com.clinic.management.model.enums.QueueStatus;

import java.time.Instant;

/**
 * DTO for queue response
 * Represents a queue entity in API responses
 */
public class QueueResponse {
    
    private Long id;
    private Long clinicId;
    private String clinicName;
    private QueueStatus queueStatus;
    private Instant createdAt;
    private Instant updatedAt;
    
    // Constructors
    public QueueResponse() {
    }
    
    /**
     * Create QueueResponse from Queue entity
     * @param queue Queue entity
     * @return QueueResponse DTO
     */
    public static QueueResponse from(Queue queue) {
        QueueResponse response = new QueueResponse();
        response.setId(queue.getId());
        response.setClinicId(queue.getClinic() != null ? queue.getClinic().getId() : null);
        response.setClinicName(queue.getClinic() != null ? queue.getClinic().getName() : null);
        response.setQueueStatus(queue.getQueueStatus());
        response.setCreatedAt(queue.getCreatedAt());
        response.setUpdatedAt(queue.getUpdatedAt());
        return response;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getClinicId() {
        return clinicId;
    }
    
    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }
    
    public String getClinicName() {
        return clinicName;
    }
    
    public void setClinicName(String clinicName) {
        this.clinicName = clinicName;
    }
    
    public QueueStatus getQueueStatus() {
        return queueStatus;
    }
    
    public void setQueueStatus(QueueStatus queueStatus) {
        this.queueStatus = queueStatus;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
