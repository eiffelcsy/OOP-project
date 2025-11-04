package com.clinic.management.dto.response;

import java.util.List;

public class PatientQueueResponse {
    private Long queueId;
    private List<QueueTicketResponse> currentTicket;  // patient's active ticket
    private List<QueueTicketResponse> queueTickets;   // other tickets in same queue

    // Getters
    public Long getQueueId() {
        return queueId;
    }

    public List<QueueTicketResponse> getCurrentTicket() {
        return currentTicket;
    }

    public List<QueueTicketResponse> getQueueTickets() {
        return queueTickets;
    }

    // Setters
    public void setQueueId(Long queueId) {
        this.queueId = queueId;
    }

    public void setCurrentTicket(List<QueueTicketResponse> currentTicket) {
        this.currentTicket = currentTicket;
    }

    public void setQueueTickets(List<QueueTicketResponse> queueTickets) {
        this.queueTickets = queueTickets;
    }
}