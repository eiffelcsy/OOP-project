package com.clinic.management.repository;

import com.clinic.management.model.Clinic;
import com.clinic.management.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Staff entity
 * Provides database access for staff member information
 */
@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    
    /**
     * Find staff member by Supabase auth user ID
     * This is the primary way to look up a staff member from JWT authentication
     * @param userId UUID from auth.users.id (as String)
     * @return Optional containing the staff member if found
     */
    @Query(value = "SELECT * FROM staff WHERE user_id = CAST(:userId AS uuid)", nativeQuery = true)
    Optional<Staff> findByUserId(@Param("userId") String userId);
    
    /**
     * Find all staff members at a specific clinic
     * @param clinic Clinic entity
     * @return List of staff members at that clinic
     */
    List<Staff> findByClinic(Clinic clinic);
    
    /**
     * Find all staff members at a clinic by clinic ID
     * @param clinicId Clinic ID
     * @return List of staff members at that clinic
     */
    @Query("SELECT s FROM Staff s WHERE s.clinic.id = :clinicId")
    List<Staff> findByClinicId(@Param("clinicId") Long clinicId);
    
    /**
     * Find all staff members with a specific role
     * @param role Staff role (e.g., "nurse", "receptionist", "doctor")
     * @return List of staff members with that role
     */
    List<Staff> findByRole(String role);
    
    /**
     * Find staff members by clinic and role
     * @param clinic Clinic entity
     * @param role Staff role
     * @return List of matching staff members
     */
    List<Staff> findByClinicAndRole(Clinic clinic, String role);
    
    /**
     * Find staff members by clinic ID and role
     * @param clinicId Clinic ID
     * @param role Staff role
     * @return List of matching staff members
     */
    @Query("SELECT s FROM Staff s WHERE s.clinic.id = :clinicId AND s.role = :role")
    List<Staff> findByClinicIdAndRole(@Param("clinicId") Long clinicId, @Param("role") String role);
    
    /**
     * Check if a staff member exists for a given user ID
     * @param userId UUID from auth.users.id (as String)
     * @return true if staff member exists
     */
    @Query(value = "SELECT EXISTS(SELECT 1 FROM staff WHERE user_id = CAST(:userId AS uuid))", nativeQuery = true)
    boolean existsByUserId(@Param("userId") String userId);
    
    /**
     * Count staff members at a specific clinic
     * @param clinicId Clinic ID
     * @return Number of staff members
     */
    @Query("SELECT COUNT(s) FROM Staff s WHERE s.clinic.id = :clinicId")
    long countByClinicId(@Param("clinicId") Long clinicId);
    
    /**
     * Count staff members with a specific role
     * @param role Staff role
     * @return Number of staff members with that role
     */
    long countByRole(String role);
    
    /**
     * Delete staff member by user ID
     * @param userId UUID from auth.users.id (as String)
     */
    @Modifying
    @Query(value = "DELETE FROM staff WHERE user_id = CAST(:userId AS uuid)", nativeQuery = true)
    void deleteByUserId(@Param("userId") String userId);
}

