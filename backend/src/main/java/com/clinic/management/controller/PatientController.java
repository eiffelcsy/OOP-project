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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.clinic.management.model.Appointment;
import com.clinic.management.service.AppointmentService;
import java.util.Optional;




@RestController
@RequestMapping("/api/patient")
public class PatientController {

    private static final Logger log = LoggerFactory.getLogger(PatientController.class);

    private final ClinicService clinicService;
    private final PatientService patientService;
    private final AppointmentService appointmentService;

    public PatientController(ClinicService clinicService, PatientService patientService, AppointmentService appointmentService) {
        this.clinicService = clinicService;
        this.patientService = patientService;
        this.appointmentService = appointmentService;
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
     * GET /api/patient/appointments - returns appointments for the logged-in patient
     */
    @GetMapping("/appointments")
    public ResponseEntity<List<Appointment>> getMyAppointments() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getPrincipal() == null) {
                log.warn("getMyAppointments: no authentication principal found");
                return ResponseEntity.status(401).build();
            }

            String userId = auth.getPrincipal().toString();
            log.info("getMyAppointments: authenticated userId={}", userId);

            Optional<com.clinic.management.model.Patient> p = patientService.getPatientByUserId(userId);
            if (p.isEmpty()) {
                log.info("getMyAppointments: no patient row found for userId={}", userId);
                return ResponseEntity.ok(List.of());
            }

            Long patientId = p.get().getId();
            log.info("getMyAppointments: resolved patientId={} for userId={}", patientId, userId);

            List<Appointment> rows = appointmentService.getAppointmentsByPatientId(patientId);
            log.info("getMyAppointments: returning {} appointments for patientId={}", rows.size(), patientId);
            return ResponseEntity.ok(rows);
        } catch (Exception ex) {
            log.error("getMyAppointments: unexpected error", ex);
            return ResponseEntity.status(500).build();
        }
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

