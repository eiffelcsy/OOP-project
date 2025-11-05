package com.clinic.management.service;

import com.clinic.management.dto.request.CreateQueueTicketRequest;
import com.clinic.management.dto.request.UpdateQueueTicketRequest;
import com.clinic.management.dto.response.QueueTicketResponse;
import com.clinic.management.exception.CustomExceptions.*;
import com.clinic.management.model.*;
import com.clinic.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class QueueTicketService {
    private final QueueTicketRepository queueTicketRepository;
    private final QueueRepository queueRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ProfileRepository profileRepository;
    
    // Added for Email notifications 
    private final QueueService queueService;

    @Autowired
    public QueueTicketService(QueueTicketRepository queueTicketRepository,
                              QueueRepository queueRepository,
                              AppointmentRepository appointmentRepository,
                              PatientRepository patientRepository,
                              ProfileRepository profileRepository,
                              QueueService queueService) {
        this.queueTicketRepository = queueTicketRepository;
        this.queueRepository = queueRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.profileRepository = profileRepository;
        // Added for Email notifications 
        this.queueService = queueService;
    }

    @Transactional
    public QueueTicket create(CreateQueueTicketRequest req) {
        Queue queue = queueRepository.findById(req.getQueueId())
                .orElseThrow(() -> new ValidationException("Queue not found with id: " + req.getQueueId()));

        QueueTicket t = new QueueTicket();
        t.setQueue(queue);

        if (req.getAppointmentId() != null) {
            Appointment appt = appointmentRepository.findById(req.getAppointmentId())
                    .orElseThrow(() -> new ValidationException("Appointment not found with id: " + req.getAppointmentId()));
            t.setAppointment(appt);
        }

    // No direct patient on queue ticket; patient is derived via appointment

        t.setTicketNumber(req.getTicketNumber());
        t.setPriority(req.getPriority() != null ? req.getPriority() : 0);
        t.setTicketStatus(req.getTicketStatus() != null ? req.getTicketStatus() : "waiting");
        t.setCalledAt(req.getCalledAt());
        t.setCompletedAt(req.getCompletedAt());
        t.setNoShowAt(req.getNoShowAt());

        QueueTicket saved = queueTicketRepository.save(t);
        
        // Trigger email notifications after creating ticket (queue positions changed)
        try {
            queueService.processQueueNotifications(saved.getQueue().getId());
        } catch (Exception e) {
            // Log but don't fail the ticket creation
            // Logging is handled in QueueService
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<QueueTicket> list(Long queueId) {
    // Use method that eagerly fetches appointment and patient to avoid N+1 queries
        return queueTicketRepository.findByQueueIdWithPatient(queueId);
    }

    @Transactional
    public QueueTicket update(Long id, UpdateQueueTicketRequest req) {
        QueueTicket t = queueTicketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Queue ticket not found with id: " + id));

        if (!req.hasUpdates()) {
            throw new ValidationException("No fields provided for update");
        }

        // Optimistic-like check using updatedAt timestamp if provided
        if (req.getExpectedUpdatedAt().isPresent()) {
            OffsetDateTime expected = req.getExpectedUpdatedAt().get();
            if (t.getUpdatedAt() == null || !t.getUpdatedAt().isEqual(expected)) {
                throw new OptimisticLockException("Queue ticket modified by another process");
            }
        }

        // ## Added for Email Notifications
        // Store old values to check if they changed
        String oldStatus = t.getTicketStatus();
        Short oldPriority = t.getPriority();
        // ## Added for Email Notifications

        req.getQueueId().ifPresent(qid -> {
            Queue q = queueRepository.findById(qid)
                    .orElseThrow(() -> new ValidationException("Queue not found with id: " + qid));
            t.setQueue(q);
        });

        req.getAppointmentId().ifPresent(aid -> {
            Appointment appt = appointmentRepository.findById(aid)
                    .orElseThrow(() -> new ValidationException("Appointment not found with id: " + aid));
            t.setAppointment(appt);
        });

    // No direct patient updates on queue ticket; change appointment if needed

        req.getTicketNumber().ifPresent(t::setTicketNumber);
        req.getPriority().ifPresent(t::setPriority);
        req.getTicketStatus().ifPresent(t::setTicketStatus);
        req.getCalledAt().ifPresent(t::setCalledAt);
        req.getCompletedAt().ifPresent(t::setCompletedAt);
        req.getNoShowAt().ifPresent(t::setNoShowAt);

        QueueTicket updated = queueTicketRepository.save(t);
        
        // ## Added for Email Notifications
        // Trigger email notifications if status or priority changed
        boolean statusChanged = req.getTicketStatus().isPresent() && 
                               !req.getTicketStatus().get().equals(oldStatus);
        boolean priorityChanged = req.getPriority().isPresent() && 
                                 !req.getPriority().get().equals(oldPriority);
        
        if (statusChanged || priorityChanged) {
            try {
                queueService.processQueueNotifications(updated.getQueue().getId());
            } catch (Exception e) {
                // Log but don't fail the update
                // Logging is handled in QueueService
            }
        }
        // ## Added for Email Notifications

        return updated;
    }

    @Transactional
    public void delete(Long id) {
        QueueTicket ticket = queueTicketRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Queue ticket not found with id: " + id));

        Long queueId = ticket.getQueue().getId();

        queueTicketRepository.deleteById(id);

        // ## Added for Email Notifications
        // Trigger email notifications after deleting ticket (queue positions changed)
        try {
            queueService.processQueueNotifications(queueId);
        } catch (Exception e) {
            // Log but don't fail the deletion
            // Logging is handled in QueueService
        }
        // ## Added for Email Notifications
    }

    /**
     * List queue tickets with patient names enriched
     * @param queueId Queue ID
     * @return List of QueueTicketResponse DTOs with patient names
     */
    @Transactional(readOnly = true)
    public List<QueueTicketResponse> listWithPatientNames(Long queueId) {
        List<QueueTicket> tickets = list(queueId);
        
        // Collect patient IDs via appointment.patientId then resolve to user IDs
        List<Long> patientIds = tickets.stream()
            .map(QueueTicket::getAppointment)
            .filter(Objects::nonNull)
            .map(Appointment::getPatientId)
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());

        Map<Long, String> patientIdToUserId = patientRepository.findByIdIn(patientIds).stream()
            .filter(p -> p.getUserId() != null)
            .collect(Collectors.toMap(Patient::getId, Patient::getUserId));

        List<String> userIds = patientIds.stream()
            .map(patientIdToUserId::get)
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());
        
        // Fetch all profiles in one query
        Map<String, String> userIdToNameMap = profileRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(Profile::getUserId, Profile::getFullName));
        
        // Convert tickets to responses and enrich with patient names
        List<QueueTicketResponse> responses = tickets.stream()
                .map(ticket -> {
                    QueueTicketResponse response = QueueTicketResponse.from(ticket);
                    // Enrich patient name via appointment.patientId -> patient.userId -> profiles
                    if (ticket.getAppointment() != null && ticket.getAppointment().getPatientId() != null) {
                        Long pid = ticket.getAppointment().getPatientId();
                        String uid = patientIdToUserId.get(pid);
                        if (uid != null) {
                            String patientName = userIdToNameMap.get(uid);
                            response.setPatientName(patientName != null ? patientName : (pid != null ? "Patient #" + pid : "Walk-in"));
                        } else {
                            response.setPatientName(pid != null ? "Patient #" + pid : "Walk-in");
                        }
                    } else {
                        response.setPatientName("Walk-in");
                    }
                    return response;
                })
                .collect(Collectors.toList());
        
        return responses;
    }
}
