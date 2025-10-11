package com.clinic.management.model;

import com.clinic.management.model.enums.QueueStatus;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * Queue entity - represents a clinic queue
 * 
 * Maps to Supabase table: queues
 * Columns:
 * - id: bigserial PRIMARY KEY
 * - clinic_id: int8 REFERENCES clinics(id) ON DELETE CASCADE
 * - queue_status: text NOT NULL (mapped to QueueStatus enum)
 * - created_at: timestamptz DEFAULT now()
 * - updated_at: timestamptz DEFAULT now()
 * 
 * Assumptions:
 * - queue_status stored as lowercase text in DB (active, paused, closed)
 * - Hard delete (no soft-delete flag in schema)
 */
@Entity
@Table(name = "queues")
public class Queue {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Foreign key to clinics table
     * This IS a JPA relationship because both tables are in 'public' schema
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;
    
    /**
     * Queue status - stored as text in DB, mapped to enum in Java
     * Values: ACTIVE (active), PAUSED (paused), CLOSED (closed)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "queue_status", nullable = false)
    private QueueStatus queueStatus;
    
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    // Constructors
    public Queue() {
    }
    
    public Queue(Clinic clinic, QueueStatus queueStatus) {
        this.clinic = clinic;
        this.queueStatus = queueStatus;
    }
    
    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Clinic getClinic() {
        return clinic;
    }
    
    public void setClinic(Clinic clinic) {
        this.clinic = clinic;
    }
    
    public QueueStatus getQueueStatus() {
        return queueStatus;
    }
    
    public void setQueueStatus(QueueStatus queueStatus) {
        this.queueStatus = queueStatus;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @Override
    public String toString() {
        return "Queue{" +
                "id=" + id +
                ", clinicId=" + (clinic != null ? clinic.getId() : null) +
                ", queueStatus=" + queueStatus +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
