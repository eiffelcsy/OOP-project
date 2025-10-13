package com.clinic.management.service;

import com.clinic.management.dto.request.CreateClinicRequest;
import com.clinic.management.dto.request.UpdateClinicRequest;
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
     * @param request Create clinic request with validation
     * @return Created clinic
     * @throws IllegalArgumentException if clinic with same name already exists
     */
    public Clinic createClinic(CreateClinicRequest request) {
        // Check if clinic with same name already exists
        if (clinicRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Clinic with name '" + request.getName() + "' already exists");
        }
        
        // Map DTO to entity
        Clinic clinic = new Clinic();
        clinic.setName(request.getName());
        clinic.setAddressLine(request.getAddressLine());
        clinic.setArea(request.getArea());
        clinic.setRegion(request.getRegion());
        clinic.setClinicType(request.getClinicType());
        clinic.setOpenTime(request.getOpenTime());
        clinic.setCloseTime(request.getCloseTime());
        clinic.setNote(request.getNote());
        clinic.setRemarks(request.getRemarks());
        
        return clinicRepository.save(clinic);
    }
    
    /**
     * Update an existing clinic
     * @param id Clinic ID
     * @param request Update clinic request (all fields optional)
     * @return Updated clinic
     * @throws IllegalArgumentException if clinic not found or name conflict
     */
    public Clinic updateClinic(Long id, UpdateClinicRequest request) {
        Clinic existingClinic = clinicRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Clinic not found with id: " + id));
        
        // Check if updating name would cause conflict
        if (request.getName() != null && !request.getName().equals(existingClinic.getName())) {
            if (clinicRepository.existsByName(request.getName())) {
                throw new IllegalArgumentException("Clinic with name '" + request.getName() + "' already exists");
            }
        }
        
        // Update fields if provided
        if (request.getName() != null) {
            existingClinic.setName(request.getName());
        }
        if (request.getAddressLine() != null) {
            existingClinic.setAddressLine(request.getAddressLine());
        }
        if (request.getArea() != null) {
            existingClinic.setArea(request.getArea());
        }
        if (request.getRegion() != null) {
            existingClinic.setRegion(request.getRegion());
        }
        if (request.getClinicType() != null) {
            existingClinic.setClinicType(request.getClinicType());
        }
        if (request.getOpenTime() != null) {
            existingClinic.setOpenTime(request.getOpenTime());
        }
        if (request.getCloseTime() != null) {
            existingClinic.setCloseTime(request.getCloseTime());
        }
        if (request.getNote() != null) {
            existingClinic.setNote(request.getNote());
        }
        if (request.getRemarks() != null) {
            existingClinic.setRemarks(request.getRemarks());
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
