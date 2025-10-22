package com.clinic.management.repository;

import com.clinic.management.model.Queue;
import com.clinic.management.model.QueueTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {
    List<QueueTicket> findByQueue(Queue queue);
    List<QueueTicket> findByQueueId(Long queueId);
}
