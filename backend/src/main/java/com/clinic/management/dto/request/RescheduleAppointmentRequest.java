package com.clinic.management.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

/**
 * DTO for rescheduling an appointment
 * 
 * Validation requirements:
 * - newStartTime: required
 * - newEndTime: required
 * 
 * Both times must be provided and newStartTime must be before newEndTime
 */
public class RescheduleAppointmentRequest {
    
    @NotNull(message = "New start time is required")
    private OffsetDateTime newStartTime;
    
    @NotNull(message = "New end time is required")
    private OffsetDateTime newEndTime;
    
    // Constructors
    public RescheduleAppointmentRequest() {
    }
    
    public RescheduleAppointmentRequest(OffsetDateTime newStartTime, OffsetDateTime newEndTime) {
        this.newStartTime = newStartTime;
        this.newEndTime = newEndTime;
    }
    
    // Getters and Setters
    public OffsetDateTime getNewStartTime() {
        return newStartTime;
    }
    
    public void setNewStartTime(OffsetDateTime newStartTime) {
        this.newStartTime = newStartTime;
    }
    
    public OffsetDateTime getNewEndTime() {
        return newEndTime;
    }
    
    public void setNewEndTime(OffsetDateTime newEndTime) {
        this.newEndTime = newEndTime;
    }
    
    @Override
    public String toString() {
        return "RescheduleAppointmentRequest{" +
                "newStartTime=" + newStartTime +
                ", newEndTime=" + newEndTime +
                '}';
    }
}

