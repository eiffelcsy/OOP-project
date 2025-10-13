package com.clinic.management.service;

import com.clinic.management.dto.request.CreateDoctorRequest;
import com.clinic.management.dto.request.UpdateDoctorRequest;
import com.clinic.management.exception.CustomExceptions.*;
import com.clinic.management.model.Doctor;
import com.clinic.management.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository repository;

    public DoctorService(DoctorRepository repository) {
        this.repository = repository;
    }

    /**
     * Get all doctors
     * @return List of all doctors
     */
    public List<Doctor> getAllDoctors() {
        return repository.findAll();
    }

    /**
     * Get doctors by clinicId
     * @param clinicId Clinic ID
     * @return List of doctors for the specified clinic
     */
    public List<Doctor> getDoctorsByClinicId(Long clinicId) {
        return repository.findByClinicId(clinicId);
    }

    /**
     * Get doctor by ID
     * @param id Doctor ID
     * @return Doctor entity
     * @throws NotFoundException if doctor not found
     */
    public Doctor getDoctorById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Doctor not found with id: " + id));
    }

    /**
     * Create a new doctor
     * @param request Create doctor request
     * @return Created doctor entity
     */
    @Transactional
    public Doctor createDoctor(CreateDoctorRequest request) {
        Doctor doctor = new Doctor();
        doctor.setName(request.getName());
        doctor.setClinicId(request.getClinicId());
        doctor.setSpecialty(request.getSpecialty());
        doctor.setActive(request.getActive() != null ? request.getActive() : true);
        
        OffsetDateTime now = OffsetDateTime.now();
        doctor.setCreatedAt(now);
        doctor.setUpdatedAt(now);
        
        return repository.save(doctor);
    }

    /**
     * Update an existing doctor
     * @param id Doctor ID
     * @param request Update doctor request
     * @return Updated doctor entity
     * @throws NotFoundException if doctor not found
     */
    @Transactional
    public Doctor updateDoctor(Long id, UpdateDoctorRequest request) {
        Doctor doctor = getDoctorById(id);
        
        // Update only provided fields
        if (request.getName() != null) {
            doctor.setName(request.getName());
        }
        if (request.getClinicId() != null) {
            doctor.setClinicId(request.getClinicId());
        }
        if (request.getSpecialty() != null) {
            doctor.setSpecialty(request.getSpecialty());
        }
        if (request.getActive() != null) {
            doctor.setActive(request.getActive());
        }
        
        doctor.setUpdatedAt(OffsetDateTime.now());
        
        return repository.save(doctor);
    }

    /**
     * Delete a doctor
     * @param id Doctor ID
     * @throws NotFoundException if doctor not found
     */
    @Transactional
    public void deleteDoctor(Long id) {
        Doctor doctor = getDoctorById(id);
        repository.delete(doctor);
    }
}
