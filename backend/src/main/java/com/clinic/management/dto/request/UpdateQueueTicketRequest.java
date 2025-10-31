package com.clinic.management.dto.request;

import java.time.OffsetDateTime;
import java.util.Optional;

public class UpdateQueueTicketRequest {
    private Long queueId;
    private Long appointmentId;
    private Integer ticketNumber;
    private Short priority;
    private String ticketStatus;
    private OffsetDateTime calledAt;
    private OffsetDateTime completedAt;
    private OffsetDateTime noShowAt;
    private OffsetDateTime expectedUpdatedAt;

    public Optional<Long> getQueueId() { return Optional.ofNullable(queueId); }
    public void setQueueId(Long queueId) { this.queueId = queueId; }
    public Optional<Long> getAppointmentId() { return Optional.ofNullable(appointmentId); }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
    public Optional<Integer> getTicketNumber() { return Optional.ofNullable(ticketNumber); }
    public void setTicketNumber(Integer ticketNumber) { this.ticketNumber = ticketNumber; }
    public Optional<Short> getPriority() { return Optional.ofNullable(priority); }
    public void setPriority(Short priority) { this.priority = priority; }
    public Optional<String> getTicketStatus() { return Optional.ofNullable(ticketStatus); }
    public void setTicketStatus(String ticketStatus) { this.ticketStatus = ticketStatus; }
    public Optional<OffsetDateTime> getCalledAt() { return Optional.ofNullable(calledAt); }
    public void setCalledAt(OffsetDateTime calledAt) { this.calledAt = calledAt; }
    public Optional<OffsetDateTime> getCompletedAt() { return Optional.ofNullable(completedAt); }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }
    public Optional<OffsetDateTime> getNoShowAt() { return Optional.ofNullable(noShowAt); }
    public void setNoShowAt(OffsetDateTime noShowAt) { this.noShowAt = noShowAt; }
    public Optional<OffsetDateTime> getExpectedUpdatedAt() { return Optional.ofNullable(expectedUpdatedAt); }
    public void setExpectedUpdatedAt(OffsetDateTime expectedUpdatedAt) { this.expectedUpdatedAt = expectedUpdatedAt; }

    public boolean hasUpdates() {
    return queueId != null || appointmentId != null || ticketNumber != null ||
                priority != null || ticketStatus != null || calledAt != null || completedAt != null || noShowAt != null;
    }
}
