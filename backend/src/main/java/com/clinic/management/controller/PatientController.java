package com.clinic.management.controller;

import com.clinic.management.model.Clinic;
import com.clinic.management.dto.response.ClinicResponse;
import com.clinic.management.service.ClinicService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patient")
public class PatientController {

    private final ClinicService clinicService;

    public PatientController(ClinicService clinicService) {
        this.clinicService = clinicService;
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
}
