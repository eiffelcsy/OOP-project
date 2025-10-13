package com.clinic.management.dto.response;

import com.clinic.management.model.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO that combines Profile data with role-specific data
 * This represents a unified "User" view for the frontend
 */
public class UserResponse {
    
    // Identifiers
    private Long profileId;
    private String userId; // Supabase auth user ID
    private String role; // "patient", "staff", or "admin"
    
    // Profile data
    private String email;
    private String fullName;
    private String avatarUrl;
    
    // Patient-specific data (null if not a patient)
    private PatientData patient;
    
    // Staff-specific data (null if not staff)
    private StaffData staff;
    
    // Admin-specific data (null if not admin)
    private AdminData admin;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Nested classes for role-specific data
    public static class PatientData {
        private Long id;
        private String nric;
        private LocalDate dob;
        private String phone;
        private String address;
        
        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getNric() { return nric; }
        public void setNric(String nric) { this.nric = nric; }
        
        public LocalDate getDob() { return dob; }
        public void setDob(LocalDate dob) { this.dob = dob; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
    }
    
    public static class StaffData {
        private Long id;
        private Long clinicId;
        private String clinicName;
        private String role; // e.g., "nurse", "receptionist", "doctor"
        
        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public Long getClinicId() { return clinicId; }
        public void setClinicId(Long clinicId) { this.clinicId = clinicId; }
        
        public String getClinicName() { return clinicName; }
        public void setClinicName(String clinicName) { this.clinicName = clinicName; }
        
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
    
    public static class AdminData {
        private Long id;
        
        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
    }
    
    // Constructors
    public UserResponse() {}
    
    /**
     * Factory method to create UserResponse from entities
     * @param profile Profile entity (required)
     * @param patient Patient entity (optional)
     * @param staff Staff entity (optional)
     * @param admin Admin entity (optional)
     * @return UserResponse DTO
     */
    public static UserResponse from(Profile profile, Patient patient, Staff staff, Admin admin) {
        UserResponse response = new UserResponse();
        
        // Set profile data
        response.setProfileId(profile.getId());
        response.setUserId(profile.getUserId());
        response.setEmail(profile.getEmail());
        response.setFullName(profile.getFullName());
        response.setAvatarUrl(profile.getAvatarUrl());
        response.setCreatedAt(profile.getCreatedAt());
        response.setUpdatedAt(profile.getUpdatedAt());
        
        // Determine primary role (prioritize admin > staff > patient)
        if (admin != null) {
            response.setRole("admin");
            AdminData adminData = new AdminData();
            adminData.setId(admin.getId());
            response.setAdmin(adminData);
        } else if (staff != null) {
            response.setRole("staff");
            StaffData staffData = new StaffData();
            staffData.setId(staff.getId());
            staffData.setClinicId(staff.getClinic().getId());
            staffData.setClinicName(staff.getClinic().getName());
            staffData.setRole(staff.getRole());
            response.setStaff(staffData);
        } else if (patient != null) {
            response.setRole("patient");
            PatientData patientData = new PatientData();
            patientData.setId(patient.getId());
            patientData.setNric(patient.getNric());
            patientData.setDob(patient.getDob());
            patientData.setPhone(patient.getPhone());
            patientData.setAddress(patient.getAddress());
            response.setPatient(patientData);
        }
        
        return response;
    }
    
    // Getters and Setters
    public Long getProfileId() {
        return profileId;
    }
    
    public void setProfileId(Long profileId) {
        this.profileId = profileId;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
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
    
    public PatientData getPatient() {
        return patient;
    }
    
    public void setPatient(PatientData patient) {
        this.patient = patient;
    }
    
    public StaffData getStaff() {
        return staff;
    }
    
    public void setStaff(StaffData staff) {
        this.staff = staff;
    }
    
    public AdminData getAdmin() {
        return admin;
    }
    
    public void setAdmin(AdminData admin) {
        this.admin = admin;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}