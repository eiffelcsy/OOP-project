package com.clinic.management.repository;

import com.clinic.management.model.Queue;
import com.clinic.management.model.enums.QueueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Queue entity
 * Provides database access for queue management
 * 
 * Uses Spring Data JPA for standard CRUD operations
 * Extends JpaSpecificationExecutor for dynamic filtering
 */
@Repository
public interface QueueRepository extends JpaRepository<Queue, Long>, JpaSpecificationExecutor<Queue> {
    
    /**
     * Find all queues for a specific clinic
     * @param clinicId Clinic ID
     * @return List of queues for the clinic
     */
    @Query("SELECT q FROM Queue q WHERE q.clinic.id = :clinicId ORDER BY q.createdAt DESC")
    List<Queue> findByClinicId(@Param("clinicId") Long clinicId);
    
    /**
     * Find queues by status
     * @param status Queue status
     * @return List of queues with the specified status
     */
    List<Queue> findByQueueStatus(QueueStatus status);
    
    /**
     * Find active queues for a clinic
     * @param clinicId Clinic ID
     * @return List of active queues
     */
    @Query("SELECT q FROM Queue q WHERE q.clinic.id = :clinicId AND q.queueStatus = 'ACTIVE' ORDER BY q.createdAt DESC")
    List<Queue> findActiveQueuesByClinicId(@Param("clinicId") Long clinicId);
    
    /**
     * Count queues by clinic ID
     * @param clinicId Clinic ID
     * @return Number of queues for the clinic
     */
    long countByClinicId(Long clinicId);
    
    /**
     * Count queues by status
     * @param status Queue status
     * @return Number of queues with the specified status
     */
    long countByQueueStatus(QueueStatus status);
}
