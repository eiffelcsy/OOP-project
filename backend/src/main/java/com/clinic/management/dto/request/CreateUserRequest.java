package com.clinic.management.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/**
 * Request DTO for creating a new user
 * Combines profile data with role-specific data
 */
public class CreateUserRequest {
    
    // Profile data
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    private String avatarUrl;
    
    // Password for Supabase auth user creation
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    // Role selection
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "patient|staff|admin", message = "Role must be 'patient', 'staff', or 'admin'")
    private String role;
    
    // Patient-specific fields (optional, used only if role=patient)
    private String nric;
    private String phone;
    private LocalDate dob;
    private String address;
    
    // Staff-specific fields (optional, used only if role=staff)
    private Long clinicId;
    
    @Pattern(regexp = "nurse|receptionist|doctor|", message = "Staff role must be 'nurse', 'receptionist', or 'doctor'")
    private String staffRole;
    
    // Constructors
    public CreateUserRequest() {}
    
    // Getters and Setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
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
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
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