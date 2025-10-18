package com.clinic.management.service;

import com.clinic.management.model.Patient;
import com.clinic.management.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    private final PatientRepository repository;

    public PatientService(PatientRepository repository) {
        this.repository = repository;
    }

    /**
     * Get all patients
     */
    public List<Patient> getAllPatients() {
        return repository.findAll();
    }

    /**
     * Get patient by numeric ID
     */
    public Optional<Patient> getPatientById(Long id) {
        return repository.findById(id);
    }

    /**
     * Get patient by Supabase user UUID
     */
    public Optional<Patient> getPatientByUserId(String userId) {
        return repository.findByUserId(userId);
    }
}
