package com.clinic.management.dto.response;

import com.clinic.management.model.Doctor;

import java.time.OffsetDateTime;

/**
 * DTO for doctor response
 * Represents a doctor entity in API responses
 */
public class DoctorResponse {
    
    private Long id;
    private Long clinicId;
    private String name;
    private String specialty;
    private Boolean active;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    // Constructors
    public DoctorResponse() {
    }
    
    /**
     * Create DoctorResponse from Doctor entity
     * @param doctor Doctor entity
     * @return DoctorResponse DTO
     */
    public static DoctorResponse from(Doctor doctor) {
        DoctorResponse response = new DoctorResponse();
        response.setId(doctor.getDoctorId());
        response.setClinicId(doctor.getClinicId());
        response.setName(doctor.getName());
        response.setSpecialty(doctor.getSpecialty());
        response.setActive(doctor.getActive());
        response.setCreatedAt(doctor.getCreatedAt());
        response.setUpdatedAt(doctor.getUpdatedAt());
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
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getSpecialty() {
        return specialty;
    }
    
    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }
    
    public Boolean getActive() {
        return active;
    }
    
    public void setActive(Boolean active) {
        this.active = active;
    }
    
    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @Override
    public String toString() {
        return "DoctorResponse{" +
                "id=" + id +
                ", clinicId=" + clinicId +
                ", name='" + name + '\'' +
                ", specialty='" + specialty + '\'' +
                ", active=" + active +
                '}';
    }
}

