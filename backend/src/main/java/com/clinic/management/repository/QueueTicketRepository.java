package com.clinic.management.repository;

import com.clinic.management.model.Queue;
import com.clinic.management.model.QueueTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Repository
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {
    List<QueueTicket> findByQueue(Queue queue);
    List<QueueTicket> findByQueueId(Long queueId);
    
    /**
     * Find tickets by queue ID and eagerly fetch appointment and its patient
     * Avoids N+1 queries when enriching with patient names via appointment
     */
    @Query("SELECT qt FROM QueueTicket qt LEFT JOIN FETCH qt.appointment a WHERE qt.queue.id = :queueId ORDER BY qt.ticketNumber ASC")
    List<QueueTicket> findByQueueIdWithPatient(@Param("queueId") Long queueId);

    /**
     * Find all queue tickets for a patient's appointments
     * Eagerly fetches appointment details to avoid N+1 queries
     */
    @Query("SELECT qt FROM QueueTicket qt LEFT JOIN FETCH qt.appointment a WHERE a.patientId = :patientId ORDER BY qt.ticketNumber ASC")
    List<QueueTicket> findByPatientId(@Param("patientId") Long patientId);

//     // CURRENTLY NOT USED
//     /**
//      * Find all queue tickets for a patient's appointments on a specific date
//      * Eagerly fetches appointment details to avoid N+1 queries
//      */
//     @Query("SELECT qt FROM QueueTicket qt LEFT JOIN FETCH qt.appointment a WHERE a.patientId = :patientId AND DATE(qt.createdAt) = :date ORDER BY qt.ticketNumber ASC")
//     List<QueueTicket> findByPatientIdAndDate(
//             @Param("patientId") Long patientId,
//             @Param("date") LocalDate date);

//     // CURRENTLY NOT USED
//     /**
//      * Find all queue tickets in a specified queue for a date
//      * Eagerly fetches appointment details to avoid N+1 queries
//      */
//     @Query("SELECT qt FROM QueueTicket qt LEFT JOIN FETCH qt.appointment a WHERE qt.queue.id = :queueId AND DATE(qt.createdAt) = :date ORDER BY qt.ticketNumber ASC")
//     List<QueueTicket> findByQueueIdAndDate(
//             @Param("queueId") Long queueId,
//             @Param("date") LocalDate date);

	/**
     * Find tickets by queue and status
     * Used for email notifications to find waiting patients
     */
    @Query("SELECT qt FROM QueueTicket qt WHERE qt.queue = :queue AND qt.ticketStatus = :status ORDER BY qt.priority DESC, qt.ticketNumber ASC")
    List<QueueTicket> findByQueueAndStatus(@Param("queue") Queue queue, @Param("status") String status);
}
