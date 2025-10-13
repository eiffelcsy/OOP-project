package com.clinic.management.controller;

import com.clinic.management.dto.response.DoctorResponse;
import com.clinic.management.model.Doctor;
import com.clinic.management.service.DoctorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for public Doctor operations
 * Provides read-only endpoints for doctors
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorService service;

    public DoctorController(DoctorService service) {
        this.service = service;
    }

    /**
     * GET /api/doctors
     * Fetch all doctors
     * @return List of all doctors as DoctorResponse DTOs
     */
    @GetMapping("/doctors")
    public List<DoctorResponse> getAllDoctors() {
        List<Doctor> doctors = service.getAllDoctors();
        return doctors.stream()
            .map(DoctorResponse::from)
            .collect(Collectors.toList());
    }

    /**
     * GET /api/doctors/clinic/{clinicId}
     * Fetch doctors by clinicId
     * @param clinicId Clinic ID
     * @return List of doctors for the specified clinic as DoctorResponse DTOs
     */
    @GetMapping("/doctors/clinic/{clinicId}")
    public List<DoctorResponse> getDoctorsByClinic(@PathVariable Long clinicId) {
        List<Doctor> doctors = service.getDoctorsByClinicId(clinicId);
        return doctors.stream()
            .map(DoctorResponse::from)
            .collect(Collectors.toList());
    }

    /**
     * GET /api/doctors/{id}
     * Fetch a single doctor by ID
     * @param id Doctor ID
     * @return Doctor as DoctorResponse DTO
     */
    @GetMapping("/doctors/{id}")
    public DoctorResponse getDoctorById(@PathVariable Long id) {
        Doctor doctor = service.getDoctorById(id);
        return DoctorResponse.from(doctor);
    }
}
