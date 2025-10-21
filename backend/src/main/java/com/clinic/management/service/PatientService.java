package com.clinic.management.service;

import com.clinic.management.model.Patient;
import com.clinic.management.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PatientService {

    private final PatientRepository repository;
    private static final Logger log = LoggerFactory.getLogger(PatientService.class);

    public PatientService(PatientRepository repository) {
        this.repository = repository;
    }

    /**
     * Get all patients
     */
    @Transactional(readOnly = true)
    public List<Patient> getAllPatients() {
        return repository.findAll();
    }

    /**
     * Get patient by numeric ID
     */
    @Transactional(readOnly = true)
    public Optional<Patient> getPatientById(Long id) {
        log.debug("getPatientById: id={}", id);
        return repository.findById(id);
    }

    /**
     * Get patient by Supabase user UUID
     */
    @Transactional(readOnly = true)
    public Optional<Patient> getPatientByUserId(String userId) {
        log.debug("getPatientByUserId: userId={}", userId);
        return repository.findByUserId(userId);
    }
}
