package com.clinic.management.service;

import com.clinic.management.dto.response.PatientQueueResponse;
import com.clinic.management.dto.response.QueueTicketResponse;
import com.clinic.management.model.QueueTicket;
import com.clinic.management.repository.QueueTicketRepository;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PatientQueueService {
    private static final String STATUS_CHECKED_IN = "Checked In";
    private static final String STATUS_CALLED = "Called";
    private static final String STATUS_COMPLETED = "Completed";
    private static final String STATUS_NO_SHOW = "No Show";
    
    private static final Logger log = LoggerFactory.getLogger(PatientQueueService.class);
    
    private final QueueTicketRepository queueTicketRepository;

    public PatientQueueService(QueueTicketRepository queueTicketRepository) {
        this.queueTicketRepository = queueTicketRepository;
    }

    /**
     * Gets queue information for a specific patient
     * @param patientId ID of the patient
     * @return PatientQueueResponse containing current ticket and queue status,
     *         or null if patient has no active tickets
     * @throws RuntimeException if there's an error retrieving queue information
     */
    public PatientQueueResponse getPatientQueueInfo(Long patientId) {
        log.debug("Getting queue info for patient: {}", patientId);
        
        try {
            // 1. Get patient's tickets
            List<QueueTicket> patientTickets = queueTicketRepository
                .findByPatientId(patientId);
                

            // 2. Filter for active patient tickets
            // Can be done in query itself for optimization
            List<QueueTicket> activeTickets = patientTickets.stream()
                .filter(t -> !t.getTicketStatus().equals(STATUS_NO_SHOW) && 
                            !t.getTicketStatus().equals(STATUS_COMPLETED))
                .collect(Collectors.toList());

            if (activeTickets.isEmpty()) {
                return null;
            }

            // 3. Get all queue IDs from active tickets
            Set<Long> queueIds = activeTickets.stream()
                .map(t -> t.getQueue().getId())
                .collect(Collectors.toSet());

            // 4. Get tickets from all relevant queues
            List<QueueTicket> allQueueTickets = new ArrayList<>();
            for (Long queueId : queueIds) {
                
                List<QueueTicket> queueTickets = queueTicketRepository.findByQueueId(queueId);
                
                // Filter out completed and no-show tickets
                // Can be done in query itself for optimization
                List<QueueTicket> activeQueueTickets = queueTickets.stream()
                    .filter(t -> !t.getTicketStatus().equals(STATUS_COMPLETED) && 
                                !t.getTicketStatus().equals(STATUS_NO_SHOW))
                    .collect(Collectors.toList());
                
                allQueueTickets.addAll(activeQueueTickets);
            }

            // 5. Build response
            PatientQueueResponse response = new PatientQueueResponse();
            response.setQueueId(activeTickets.get(0).getQueue().getId());
            
            response.setCurrentTicket(activeTickets.stream()
                .map(QueueTicketResponse::from)
                .collect(Collectors.toList()));

            response.setQueueTickets(allQueueTickets.stream()
                .filter(t -> !activeTickets.contains(t))
                .map(QueueTicketResponse::from)
                .collect(Collectors.toList()));

            return response;
        } catch (Exception e) {
            log.error("Failed to get queue info for patient {}: {}", patientId, e.getMessage());
            throw new RuntimeException("Error retrieving queue information", e);
        }
    }
}