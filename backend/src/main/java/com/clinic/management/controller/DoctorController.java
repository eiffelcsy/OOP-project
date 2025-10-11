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

    // ✅ GET all active doctors
    @GetMapping("/doctors")
    public List<Doctor> getAllDoctors() {
        return service.getActiveDoctors();
    }

    // ✅ GET doctor by ID
    @GetMapping("/doctors/{clinicId}")
    public Doctor getDoctorById(@PathVariable Long clinicId) {
        return service.getDoctorById(clinicId);
    }

    // ✅ POST - add a new doctor
    @PostMapping("/doctors")
    public Doctor addDoctor(@RequestBody Doctor doctor) {
        return service.addDoctor(doctor);
    }

    // ✅ PUT - update doctor
    @PutMapping("/doctors/{clinicId}")
    public Doctor updateDoctor(@PathVariable Long clinicId, @RequestBody Doctor updatedDoctor) {
        return service.updateDoctor(clinicId, updatedDoctor);
    }

    // ✅ DELETE - remove doctor
    @DeleteMapping("/doctors/{clinicId}")
    public void deleteDoctor(@PathVariable Long clinicId) {
        service.deleteDoctor(clinicId);
    }
}
