package com.clinic.management.service;

import com.clinic.management.model.Clinic;
import com.clinic.management.repository.ClinicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service layer for Clinic management
 * Handles business logic for clinic operations
 */
@Service
@Transactional
public class ClinicService {
    
    private final ClinicRepository clinicRepository;
    
    @Autowired
    public ClinicService(ClinicRepository clinicRepository) {
        this.clinicRepository = clinicRepository;
    }
    
    /**
     * Get all clinics
     * @return List of all clinics
     */
    public List<Clinic> getAllClinics() {
        return clinicRepository.findAll();
    }
    
    /**
     * Get clinic by ID
     * @param id Clinic ID
     * @return Optional containing the clinic if found
     */
    public Optional<Clinic> getClinicById(Long id) {
        return clinicRepository.findById(id);
    }
    
    /**
     * Create a new clinic
     * @param clinic Clinic data
     * @return Created clinic
     * @throws IllegalArgumentException if clinic with same name already exists
     */
    public Clinic createClinic(Clinic clinic) {
        // Check if clinic with same name already exists
        if (clinic.getName() != null && clinicRepository.existsByName(clinic.getName())) {
            throw new IllegalArgumentException("Clinic with name '" + clinic.getName() + "' already exists");
        }
        
        return clinicRepository.save(clinic);
    }
    
    /**
     * Update an existing clinic
     * @param id Clinic ID
     * @param clinicData Updated clinic data
     * @return Updated clinic
     * @throws IllegalArgumentException if clinic not found or name conflict
     */
    public Clinic updateClinic(Long id, Clinic clinicData) {
        Clinic existingClinic = clinicRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Clinic not found with id: " + id));
        
        // Check if updating name would cause conflict
        if (clinicData.getName() != null && !clinicData.getName().equals(existingClinic.getName())) {
            if (clinicRepository.existsByName(clinicData.getName())) {
                throw new IllegalArgumentException("Clinic with name '" + clinicData.getName() + "' already exists");
            }
        }
        
        // Update fields if provided
        if (clinicData.getName() != null) {
            existingClinic.setName(clinicData.getName());
        }
        if (clinicData.getAddressLine() != null) {
            existingClinic.setAddressLine(clinicData.getAddressLine());
        }
        if (clinicData.getArea() != null) {
            existingClinic.setArea(clinicData.getArea());
        }
        if (clinicData.getRegion() != null) {
            existingClinic.setRegion(clinicData.getRegion());
        }
        if (clinicData.getClinicType() != null) {
            existingClinic.setClinicType(clinicData.getClinicType());
        }
        if (clinicData.getOpenTime() != null) {
            existingClinic.setOpenTime(clinicData.getOpenTime());
        }
        if (clinicData.getCloseTime() != null) {
            existingClinic.setCloseTime(clinicData.getCloseTime());
        }
        if (clinicData.getNote() != null) {
            existingClinic.setNote(clinicData.getNote());
        }
        if (clinicData.getRemarks() != null) {
            existingClinic.setRemarks(clinicData.getRemarks());
        }
        if (clinicData.getSourceRef() != null) {
            existingClinic.setSourceRef(clinicData.getSourceRef());
        }
        
        return clinicRepository.save(existingClinic);
    }
    
    /**
     * Delete a clinic
     * @param id Clinic ID
     * @throws IllegalArgumentException if clinic not found
     */
    public void deleteClinic(Long id) {
        if (!clinicRepository.existsById(id)) {
            throw new IllegalArgumentException("Clinic not found with id: " + id);
        }
        clinicRepository.deleteById(id);
    }
    
    /**
     * Search clinics by name
     * @param name Partial clinic name
     * @return List of matching clinics
     */
    public List<Clinic> searchClinicsByName(String name) {
        return clinicRepository.searchByName(name);
    }
    
    /**
     * Get clinics by region
     * @param region Region name
     * @return List of clinics in the region
     */
    public List<Clinic> getClinicsByRegion(String region) {
        return clinicRepository.findByRegionOrderByNameAsc(region);
    }
    
    /**
     * Get clinics by area
     * @param area Area name
     * @return List of clinics in the area
     */
    public List<Clinic> getClinicsByArea(String area) {
        return clinicRepository.findByArea(area);
    }
    
    /**
     * Get clinics by type
     * @param clinicType Clinic type
     * @return List of clinics of that type
     */
    public List<Clinic> getClinicsByType(String clinicType) {
        return clinicRepository.findByClinicType(clinicType);
    }
}
