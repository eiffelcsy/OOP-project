package com.clinic.management.service;

import com.clinic.management.model.Doctor;
import com.clinic.management.repository.DoctorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository repository;

    public DoctorService(DoctorRepository repository) {
        this.repository = repository;
    }

    // Get all doctors
    public List<Doctor> getAllDoctors() {
        return repository.findAll();
    }

    // Get doctors by clinicId
    public List<Doctor> getDoctorsByClinicId(Long clinicId) {
        return repository.findByClinicId(clinicId);
    }

    // Optional: add, update, delete methods if needed later
}
