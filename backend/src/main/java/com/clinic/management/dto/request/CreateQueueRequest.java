package com.clinic.management.dto.request;

import com.clinic.management.model.enums.QueueStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * DTO for creating a new queue
 * 
 * Validation requirements:
 * - clinicId: must be positive (>0) and not null
 * - queueStatus: must not be null, defaults to ACTIVE if not provided
 */
public class CreateQueueRequest {
    
    @NotNull(message = "Clinic ID is required")
    @Positive(message = "Clinic ID must be positive")
    private Long clinicId;
    
    @NotNull(message = "Queue status is required")
    private QueueStatus queueStatus = QueueStatus.ACTIVE;
    
    // Constructors
    public CreateQueueRequest() {
    }
    
    public CreateQueueRequest(Long clinicId, QueueStatus queueStatus) {
        this.clinicId = clinicId;
        this.queueStatus = queueStatus != null ? queueStatus : QueueStatus.ACTIVE;
    }
    
    // Getters and Setters
    public Long getClinicId() {
        return clinicId;
    }
    
    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }
    
    public QueueStatus getQueueStatus() {
        return queueStatus;
    }
    
    public void setQueueStatus(QueueStatus queueStatus) {
        this.queueStatus = queueStatus;
    }
    
    @Override
    public String toString() {
        return "CreateQueueRequest{" +
                "clinicId=" + clinicId +
                ", queueStatus=" + queueStatus +
                '}';
    }
}
