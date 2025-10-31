package com.clinic.management.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

/**
 * QueueTicket entity mapping to public.queue_tickets
 */
@Entity
@Table(name = "queue_tickets")
public class QueueTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "queue_id", nullable = false)
    private Queue queue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;


    @Column(name = "ticket_number", nullable = false)
    private Integer ticketNumber;

    @Column(name = "priority", nullable = false)
    private Short priority = 0;

    @Column(name = "ticket_status", nullable = false)
    private String ticketStatus = "waiting";

    @Column(name = "called_at")
    private OffsetDateTime calledAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "no_show_at")
    private OffsetDateTime noShowAt;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Queue getQueue() { return queue; }
    public void setQueue(Queue queue) { this.queue = queue; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    // Removed direct patient relation; derive via appointment.getPatient()

    public Integer getTicketNumber() { return ticketNumber; }
    public void setTicketNumber(Integer ticketNumber) { this.ticketNumber = ticketNumber; }

    public Short getPriority() { return priority; }
    public void setPriority(Short priority) { this.priority = priority; }

    public String getTicketStatus() { return ticketStatus; }
    public void setTicketStatus(String ticketStatus) { this.ticketStatus = ticketStatus; }

    public OffsetDateTime getCalledAt() { return calledAt; }
    public void setCalledAt(OffsetDateTime calledAt) { this.calledAt = calledAt; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }

    public OffsetDateTime getNoShowAt() { return noShowAt; }
    public void setNoShowAt(OffsetDateTime noShowAt) { this.noShowAt = noShowAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
