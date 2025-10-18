package com.clinic.management.controller;

import com.clinic.management.model.Clinic;
import com.clinic.management.model.Patient;
import com.clinic.management.service.PatientService;
import com.clinic.management.dto.response.ClinicResponse;
import com.clinic.management.service.ClinicService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;




@RestController
@RequestMapping("/api/patient")
public class PatientController {

    private final ClinicService clinicService;
    private final PatientService patientService;

    public PatientController(ClinicService clinicService, PatientService patientService) {
        this.clinicService = clinicService;
        this.patientService = patientService;
    }

    /**
     * GET /api/patient/clinics
     * Fetch all clinics
     * @return List of all clinics as ClinicResponse DTOs
    */
    @GetMapping("/clinics")
    public List<ClinicResponse> getAllClinics() {
        return clinicService.getAllClinics().stream()
                .map(ClinicResponse::from)
                .collect(Collectors.toList());
    }


    
    /**
     * Get all patients
     */
    @GetMapping("/all")
    public List<Patient> getAllPatients() {
        return patientService.getAllPatients();
    }

    /**
     * Get a single patient by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get a patient by Supabase user UUID
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Patient> getPatientByUserId(@PathVariable String userId) {
        return patientService.getPatientByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

