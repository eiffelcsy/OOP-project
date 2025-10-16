package com.clinic.management.repository;

import com.clinic.management.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.hibernate.jpa.AvailableHints;
import org.springframework.data.jpa.repository.QueryHints;
import jakarta.persistence.QueryHint;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Admin entity
 * Provides database access for administrator information
 */
@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    
    /**
     * Find admin by Supabase auth user ID
     * This is the primary way to look up an admin from JWT authentication
     * @param userId UUID from auth.users.id (as String)
     * @return Optional containing the admin if found
     */
    @Query(value = "SELECT * FROM admins WHERE user_id = CAST(:userId AS uuid)", nativeQuery = true)
    Optional<Admin> findByUserId(@Param("userId") String userId);
    
    /**
     * Check if an admin exists for a given user ID
     * @param userId UUID from auth.users.id (as String)
     * @return true if admin exists
     */
    @Query(value = "SELECT EXISTS(SELECT 1 FROM admins WHERE user_id = CAST(:userId AS uuid))", nativeQuery = true)
    boolean existsByUserId(@Param("userId") String userId);
    
    /**
     * Count total number of admins
     * @return Total admin count
     */
    @Query("SELECT COUNT(a) FROM Admin a")
    long countAllAdmins();
    
    /**
     * Delete admin by user ID
     * @param userId UUID from auth.users.id (as String)
     */
    @Modifying
    @Query(value = "DELETE FROM admins WHERE user_id = CAST(:userId AS uuid)", nativeQuery = true)
    void deleteByUserId(@Param("userId") String userId);
}

