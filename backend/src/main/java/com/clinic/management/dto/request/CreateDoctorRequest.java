package com.clinic.management.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for creating a new doctor
 * 
 * Validation requirements:
 * - name: required, max 255 characters
 * - clinicId: required
 * - specialty: optional
 * - active: optional, defaults to true if not provided
 */
public class CreateDoctorRequest {
    
    @JsonProperty("name")
    @NotBlank(message = "Doctor name is required")
    @Size(max = 255, message = "Doctor name must not exceed 255 characters")
    private String name;
    
    @JsonProperty("clinicId")
    @NotNull(message = "Clinic ID is required")
    private Long clinicId;
    
    @JsonProperty("specialty")
    private String specialty;
    
    @JsonProperty("active")
    private Boolean active;
    
    // Constructors
    public CreateDoctorRequest() {
    }
    
    public CreateDoctorRequest(String name, Long clinicId, String specialty, Boolean active) {
        this.name = name;
        this.clinicId = clinicId;
        this.specialty = specialty;
        this.active = active;
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
        return "CreateDoctorRequest{" +
                "name='" + name + '\'' +
                ", clinicId=" + clinicId +
                ", specialty='" + specialty + '\'' +
                ", active=" + active +
                '}';
    }
}

