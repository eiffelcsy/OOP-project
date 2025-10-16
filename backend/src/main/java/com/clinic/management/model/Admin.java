package com.clinic.management.model;

import com.clinic.management.util.UuidToStringConverter;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Admin entity - stores administrator information
 * Links to Supabase auth.users via user_id (UUID string)
 * 
 * Admins have system-wide privileges and are not tied to a specific clinic
 */
@Entity
@Table(name = "admins")
public class Admin {
    
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
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Admin() {
    }
    
    public Admin(String userId) {
        this.userId = userId;
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
        return "Admin{" +
                "id=" + id +
                ", userId='" + userId + '\'' +
                '}';
    }
}
