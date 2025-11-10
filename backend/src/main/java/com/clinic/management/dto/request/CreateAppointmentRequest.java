package com.clinic.management.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.OffsetDateTime;

/**
 * DTO for creating a new appointment
 * 
 * Validation requirements:
 * - doctorId: required, must be positive
 * - clinicId: required, must be positive
 * - startTime: required
 * - endTime: required
 * - treatmentSummary: optional
 * 
 * Note: patientId is automatically set from the authenticated user in PatientController
 */
public class CreateAppointmentRequest {
    
    @NotNull(message = "Doctor ID is required")
    @Positive(message = "Doctor ID must be positive")
    private Long doctorId;
    
    @NotNull(message = "Clinic ID is required")
    @Positive(message = "Clinic ID must be positive")
    private Long clinicId;
    
    @NotNull(message = "Start time is required")
    private OffsetDateTime startTime;
    
    @NotNull(message = "End time is required")
    private OffsetDateTime endTime;
    
    private String treatmentSummary;
    
    // Constructors
    public CreateAppointmentRequest() {
    }
    
    public CreateAppointmentRequest(Long doctorId, Long clinicId, OffsetDateTime startTime, 
                                   OffsetDateTime endTime, String treatmentSummary) {
        this.doctorId = doctorId;
        this.clinicId = clinicId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.treatmentSummary = treatmentSummary;
    }
    
    // Getters and Setters
    public Long getDoctorId() {
        return doctorId;
    }
    
    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }
    
    public Long getClinicId() {
        return clinicId;
    }
    
    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }
    
    public OffsetDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(OffsetDateTime startTime) {
        this.startTime = startTime;
    }
    
    public OffsetDateTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(OffsetDateTime endTime) {
        this.endTime = endTime;
    }
    
    public String getTreatmentSummary() {
        return treatmentSummary;
    }
    
    public void setTreatmentSummary(String treatmentSummary) {
        this.treatmentSummary = treatmentSummary;
    }
    
    @Override
    public String toString() {
        return "CreateAppointmentRequest{" +
                "doctorId=" + doctorId +
                ", clinicId=" + clinicId +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", treatmentSummary='" + treatmentSummary + '\'' +
                '}';
    }
}

