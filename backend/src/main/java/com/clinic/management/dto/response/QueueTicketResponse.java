package com.clinic.management.dto.response;

import com.clinic.management.model.QueueTicket;

import java.time.OffsetDateTime;

public class QueueTicketResponse {
    private Long id;
    private Long queueId;
    private Long appointmentId;
    private String patientName; // Added: patient's full name from profiles
    private Integer ticketNumber;
    private Short priority;
    private String ticketStatus;
    private OffsetDateTime calledAt;
    private OffsetDateTime completedAt;
    private OffsetDateTime noShowAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static QueueTicketResponse from(QueueTicket t) {
        QueueTicketResponse r = new QueueTicketResponse();
        r.id = t.getId();
        r.queueId = t.getQueue() != null ? t.getQueue().getId() : null;
        r.appointmentId = t.getAppointment() != null ? t.getAppointment().getId() : null;
        r.ticketNumber = t.getTicketNumber();
        r.priority = t.getPriority();
        r.ticketStatus = t.getTicketStatus();
        r.calledAt = t.getCalledAt();
        r.completedAt = t.getCompletedAt();
        r.noShowAt = t.getNoShowAt();
        r.createdAt = t.getCreatedAt();
        r.updatedAt = t.getUpdatedAt();
        return r;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getQueueId() { return queueId; }
    public void setQueueId(Long queueId) { this.queueId = queueId; }
    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
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
