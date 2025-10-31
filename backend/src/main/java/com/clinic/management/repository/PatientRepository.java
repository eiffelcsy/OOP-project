package com.clinic.management.repository;

import com.clinic.management.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Patient entity
 * Provides database access for patient information
 */
@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    /**
     * Find patients by a list of IDs
     */
    List<Patient> findByIdIn(List<Long> ids);
    
    /**
     * Find patient by Supabase auth user ID
     * This is the primary way to look up a patient from JWT authentication
     * @param userId UUID from auth.users.id (as String)
     * @return Optional containing the patient if found
     */
    @Query(value = "SELECT * FROM patients WHERE user_id = CAST(:userId AS uuid)", nativeQuery = true)
    Optional<Patient> findByUserId(@Param("userId") String userId);
    
    /**
     * Find patient by NRIC (National Registration Identity Card)
     * @param nric Patient's NRIC
     * @return Optional containing the patient if found
     */
    Optional<Patient> findByNric(String nric);
    
    /**
     * Find patient by phone number
     * @param phone Patient's phone number
     * @return Optional containing the patient if found
     */
    Optional<Patient> findByPhone(String phone);
    
    /**
     * Find all patients born on a specific date
     * @param dob Date of birth
     * @return List of patients with that DOB
     */
    List<Patient> findByDob(LocalDate dob);
    
    /**
     * Find patients by partial phone number match
     * @param phone Partial phone number
     * @return List of matching patients
     */
    @Query("SELECT p FROM Patient p WHERE p.phone LIKE CONCAT('%', :phone, '%')")
    List<Patient> searchByPhone(@Param("phone") String phone);
    
    /**
     * Find patients by partial address match (case-insensitive)
     * @param address Partial address
     * @return List of matching patients
     */
    @Query("SELECT p FROM Patient p WHERE LOWER(p.address) LIKE LOWER(CONCAT('%', :address, '%'))")
    List<Patient> searchByAddress(@Param("address") String address);
    
    /**
     * Check if a patient exists for a given user ID
     * @param userId UUID from auth.users.id (as String)
     * @return true if patient exists
     */
    @Query(value = "SELECT EXISTS(SELECT 1 FROM patients WHERE user_id = CAST(:userId AS uuid))", nativeQuery = true)
    boolean existsByUserId(@Param("userId") String userId);
    
    /**
     * Check if a patient exists with the given NRIC
     * @param nric Patient's NRIC
     * @return true if patient exists
     */
    boolean existsByNric(String nric);
    
    /**
     * Count total number of patients
     * @return Total patient count
     */
    @Query("SELECT COUNT(p) FROM Patient p")
    long countAllPatients();
    
    /**
     * Delete patient by user ID
     * @param userId UUID from auth.users.id (as String)
     */
    @Modifying
    @Query(value = "DELETE FROM patients WHERE user_id = CAST(:userId AS uuid)", nativeQuery = true)
    void deleteByUserId(@Param("userId") String userId);
}

