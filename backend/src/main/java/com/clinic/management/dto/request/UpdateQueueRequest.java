package com.clinic.management.dto.request;

import com.clinic.management.model.enums.QueueStatus;
import jakarta.validation.constraints.Positive;

import java.time.Instant;
import java.util.Optional;

/**
 * DTO for updating an existing queue
 * 
 * All fields are optional - only provided fields will be updated
 * Validation applied only to fields that are present:
 * - clinicId: if present, must be positive (>0)
 * - expectedUpdatedAt: if present, used for optimistic locking
 */
public class UpdateQueueRequest {
    
    @Positive(message = "Clinic ID must be positive")
    private Long clinicId;
    
    private QueueStatus queueStatus;
    
    /**
     * For optimistic locking - if provided, update only succeeds if
     * the current updated_at matches this value
     */
    private Instant expectedUpdatedAt;
    
    // Constructors
    public UpdateQueueRequest() {
    }
    
    // Getters and Setters
    public Optional<Long> getClinicId() {
        return Optional.ofNullable(clinicId);
    }
    
    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }
    
    public Optional<QueueStatus> getQueueStatus() {
        return Optional.ofNullable(queueStatus);
    }
    
    public void setQueueStatus(QueueStatus queueStatus) {
        this.queueStatus = queueStatus;
    }
    
    public Optional<Instant> getExpectedUpdatedAt() {
        return Optional.ofNullable(expectedUpdatedAt);
    }
    
    public void setExpectedUpdatedAt(Instant expectedUpdatedAt) {
        this.expectedUpdatedAt = expectedUpdatedAt;
    }
    
    /**
     * Check if any field is set for update
     * @return true if at least one field is set
     */
    public boolean hasUpdates() {
        return clinicId != null || queueStatus != null;
    }
    
    @Override
    public String toString() {
        return "UpdateQueueRequest{" +
                "clinicId=" + clinicId +
                ", queueStatus=" + queueStatus +
                ", expectedUpdatedAt=" + expectedUpdatedAt +
                '}';
    }
}
