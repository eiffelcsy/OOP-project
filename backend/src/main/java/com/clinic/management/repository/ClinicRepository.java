package com.clinic.management.repository;

import com.clinic.management.model.Clinic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Clinic entity
 * Provides database access for clinic information
 */
@Repository
public interface ClinicRepository extends JpaRepository<Clinic, Long> {
    
    /**
     * Find clinic by name
     * @param name Clinic name
     * @return Optional containing the clinic if found
     */
    Optional<Clinic> findByName(String name);
    
    /**
     * Find all clinics in a specific region
     * @param region Region name
     * @return List of clinics in the region
     */
    List<Clinic> findByRegion(String region);
    
    /**
     * Find all clinics in a specific area
     * @param area Area name
     * @return List of clinics in the area
     */
    List<Clinic> findByArea(String area);
    
    /**
     * Find clinics by region and area
     * @param region Region name
     * @param area Area name
     * @return List of clinics matching both criteria
     */
    List<Clinic> findByRegionAndArea(String region, String area);
    
    /**
     * Find clinics by type (e.g., "general", "specialist")
     * @param clinicType Type of clinic
     * @return List of clinics of that type
     */
    List<Clinic> findByClinicType(String clinicType);
    
    /**
     * Search clinics by name (case-insensitive partial match)
     * @param name Partial clinic name
     * @return List of matching clinics
     */
    @Query("SELECT c FROM Clinic c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Clinic> searchByName(@Param("name") String name);
    
    /**
     * Find all clinics in a region, ordered by name
     * @param region Region name
     * @return List of clinics ordered by name
     */
    List<Clinic> findByRegionOrderByNameAsc(String region);
    
    /**
     * Check if a clinic exists with the given name
     * @param name Clinic name
     * @return true if clinic exists
     */
    boolean existsByName(String name);
}

