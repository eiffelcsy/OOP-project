package com.clinic.management.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.OffsetDateTime;

public class CreateQueueTicketRequest {
    @NotNull(message = "Queue ID is required")
    @Positive(message = "Queue ID must be positive")
    private Long queueId;

    private Long appointmentId;

    @NotNull(message = "Ticket number is required")
    @Positive(message = "Ticket number must be positive")
    private Integer ticketNumber;

    private Short priority; // defaults in service if null
    private String ticketStatus; // defaults to 'waiting' if null

    private OffsetDateTime calledAt;
    private OffsetDateTime completedAt;
    private OffsetDateTime noShowAt;

    public Long getQueueId() { return queueId; }
    public void setQueueId(Long queueId) { this.queueId = queueId; }
    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
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
}
