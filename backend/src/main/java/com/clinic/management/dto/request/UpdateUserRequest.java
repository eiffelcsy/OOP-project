package com.clinic.management.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

/**
 * Request DTO for updating an existing user
 * All fields are optional - only provided fields will be updated
 */
public class UpdateUserRequest {
    
    // Profile data
    private String fullName;
    private String avatarUrl;
    
    // Patient-specific fields
    private String nric;
    private String phone;
    private LocalDate dob;
    private String address;
    
    // Staff-specific fields
    private Long clinicId;
    
    @Pattern(regexp = "nurse|receptionist|doctor|", message = "Staff role must be 'nurse', 'receptionist', or 'doctor'")
    private String staffRole;
    
    // Constructors
    public UpdateUserRequest() {}
    
    // Getters and Setters
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public String getAvatarUrl() {
        return avatarUrl;
    }
    
    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
    
    public String getNric() {
        return nric;
    }
    
    public void setNric(String nric) {
        this.nric = nric;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public LocalDate getDob() {
        return dob;
    }
    
    public void setDob(LocalDate dob) {
        this.dob = dob;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public Long getClinicId() {
        return clinicId;
    }
    
    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }
    
    public String getStaffRole() {
        return staffRole;
    }
    
    public void setStaffRole(String staffRole) {
        this.staffRole = staffRole;
    }
}