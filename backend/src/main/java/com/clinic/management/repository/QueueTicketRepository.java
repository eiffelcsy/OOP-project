package com.clinic.management.repository;

import com.clinic.management.model.Queue;
import com.clinic.management.model.QueueTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {
    List<QueueTicket> findByQueue(Queue queue);
    List<QueueTicket> findByQueueId(Long queueId);
    
    /**
     * Find tickets by queue ID and eagerly fetch patient relationship
     * This helps avoid N+1 query problem when fetching patient names
     */
    @Query("SELECT qt FROM QueueTicket qt LEFT JOIN FETCH qt.patient WHERE qt.queue.id = :queueId ORDER BY qt.ticketNumber ASC")
    List<QueueTicket> findByQueueIdWithPatient(@Param("queueId") Long queueId);
}
