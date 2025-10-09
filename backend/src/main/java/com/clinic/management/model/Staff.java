package com.clinic.management.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Staff entity - stores staff member information
 * Links to Supabase auth.users via user_id (UUID string)
 * Links to Clinic entity via clinic_id (JPA relationship)
 */
@Entity
@Table(name = "staff")
public class Staff {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Foreign key to auth.users.id (Supabase Auth)
     * This is a UUID stored as String, not a JPA relationship
     */
    @Column(name = "user_id", nullable = false, unique = true)
    private String userId;
    
    /**
     * Foreign key to clinics table
     * This IS a JPA relationship because both tables are in 'public' schema
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;
    
    @Column(name = "role", nullable = false)
    private String role; // e.g., "nurse", "receptionist", "doctor"
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Staff() {
    }
    
    public Staff(String userId, Clinic clinic, String role) {
        this.userId = userId;
        this.clinic = clinic;
        this.role = role;
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
    
    public Clinic getClinic() {
        return clinic;
    }
    
    public void setClinic(Clinic clinic) {
        this.clinic = clinic;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
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
        return "Staff{" +
                "id=" + id +
                ", userId='" + userId + '\'' +
                ", role='" + role + '\'' +
                '}';
    }
}
