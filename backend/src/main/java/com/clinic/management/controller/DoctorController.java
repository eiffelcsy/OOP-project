package com.clinic.management.controller;

import com.clinic.management.model.Doctor;
import com.clinic.management.service.DoctorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorService service;

    public DoctorController(DoctorService service) {
        this.service = service;
    }

    // ✅ GET all doctors
    @GetMapping("/doctors")
    public List<Doctor> getAllDoctors() {
        return service.getAllDoctors();
    }

    // ✅ GET doctors by clinicId
    @GetMapping("/doctors/{clinicId}")
    public List<Doctor> getDoctorsByClinic(@PathVariable Long clinicId) {
        return service.getDoctorsByClinicId(clinicId);
    }
}
