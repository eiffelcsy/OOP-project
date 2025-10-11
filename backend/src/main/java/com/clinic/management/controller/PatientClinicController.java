package com.clinic.management.controller;

import com.clinic.management.model.Clinic;
import com.clinic.management.service.ClinicService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/patient/clinics")
public class PatientClinicController {

    private final ClinicService clinicService;

    public PatientClinicController(ClinicService clinicService) {
        this.clinicService = clinicService;
    }

    @GetMapping
    public List<Clinic> getAllClinics() {
        return clinicService.getAllClinics();
    }
}
