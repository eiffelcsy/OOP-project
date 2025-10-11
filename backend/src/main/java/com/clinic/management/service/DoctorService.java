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

    public List<Doctor> getAllDoctors() {
        return repository.findAll();
    }

    public List<Doctor> getActiveDoctors() {
        return repository.findByActiveTrue();
    }

    public Doctor getDoctorById(Long clinicId) {
        return repository.findById(clinicId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + clinicId));
    }

    public Doctor addDoctor(Doctor doctor) {
        return repository.save(doctor);
    }

    public Doctor updateDoctor(Long clinicId, Doctor updatedDoctor) {
        Doctor existing = getDoctorById(clinicId);
        existing.setName(updatedDoctor.getName());
        existing.setSpecialty(updatedDoctor.getSpecialty());
        existing.setActive(updatedDoctor.getActive());
        existing.setUpdatedAt(updatedDoctor.getUpdatedAt());
        return repository.save(existing);
    }

    public void deleteDoctor(Long clinicId) {
        repository.deleteById(clinicId);
    }
}
