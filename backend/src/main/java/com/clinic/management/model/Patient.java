package com.clinic.management.model;

import com.clinic.management.util.UuidToStringConverter;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Patient entity - stores patient-specific information
 * Links to Supabase auth.users via user_id (UUID string)
 * 
 * IMPORTANT: user_id is NOT a JPA @ManyToOne relationship because:
 * 1. auth.users table is in the 'auth' schema (not 'public')
 * 2. Supabase manages auth.users separately
 * 3. We store the UUID as a String reference
 */
@Entity
@Table(name = "patients")
public class Patient {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Foreign key to auth.users.id (Supabase Auth)
     * This is a UUID stored as String, not a JPA relationship
     */
    @Convert(converter = UuidToStringConverter.class)
    @Column(name = "user_id", nullable = false, unique = true)
    private String userId;
    
    @Column(name = "nric")
    private String nric; // National Registration Identity Card
    
    @Column(name = "dob")
    private LocalDate dob; // Date of birth
    
    private String phone;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Patient() {
    }
    
    public Patient(String userId, String nric, LocalDate dob, String phone) {
        this.userId = userId;
        this.nric = nric;
        this.dob = dob;
        this.phone = phone;
    }
    
    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getNric() {
        return nric;
    }
    
    public void setNric(String nric) {
        this.nric = nric;
    }
    
    public LocalDate getDob() {
        return dob;
    }
    
    public void setDob(LocalDate dob) {
        this.dob = dob;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
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
    
    @Override
    public String toString() {
        return "Patient{" +
                "id=" + id +
                ", userId='" + userId + '\'' +
                ", phone='" + phone + '\'' +
                '}';
    }
}
