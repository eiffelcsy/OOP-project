package com.clinic.management.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;

/**
 * DTO for updating an existing doctor
 * 
 * All fields are optional - only provided fields will be updated
 * Validation requirements:
 * - name: if provided, max 255 characters
 */
public class UpdateDoctorRequest {
    
    @JsonProperty("name")
    @Size(max = 255, message = "Doctor name must not exceed 255 characters")
    private String name;
    
    @JsonProperty("clinicId")
    private Long clinicId;
    
    @JsonProperty("specialty")
    private String specialty;
    
    @JsonProperty("active")
    private Boolean active;
    
    // Constructors
    public UpdateDoctorRequest() {
    }
    
    // Getters and Setters
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Long getClinicId() {
        return clinicId;
    }
    
    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
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
    
    @Override
    public String toString() {
        return "UpdateDoctorRequest{" +
                "name='" + name + '\'' +
                ", clinicId=" + clinicId +
                ", specialty='" + specialty + '\'' +
                ", active=" + active +
                '}';
    }
}

