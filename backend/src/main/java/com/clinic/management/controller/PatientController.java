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
import com.clinic.management.service.DoctorService;
import com.clinic.management.dto.response.AppointmentResponse;
import com.clinic.management.model.Doctor;
import com.clinic.management.model.Clinic;
import java.util.Optional;




@RestController
@RequestMapping("/api/patient")
public class PatientController {

    private static final Logger log = LoggerFactory.getLogger(PatientController.class);

    private final ClinicService clinicService;
    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final DoctorService doctorService;

    public PatientController(ClinicService clinicService, PatientService patientService, AppointmentService appointmentService, DoctorService doctorService) {
        this.clinicService = clinicService;
        this.patientService = patientService;
        this.appointmentService = appointmentService;
        this.doctorService = doctorService;
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
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments() {
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
            log.info("getMyAppointments: found {} appointments for patientId={}", rows.size(), patientId);

            // Map to DTO with clinic and doctor details
            List<AppointmentResponse> resp = rows.stream().map(a -> {
                AppointmentResponse ar = new AppointmentResponse();
                ar.id = a.getId();
                ar.patient_id = a.getPatientId();
                ar.doctor_id = a.getDoctorId();
                ar.clinic_id = a.getClinicId();
                ar.start_time = a.getStartTime();
                ar.end_time = a.getEndTime();
                ar.treatment_summary = a.getTreatmentSummary();
                ar.status = a.getStatus();
                ar.created_at = a.getCreatedAt();
                ar.updated_at = a.getUpdatedAt();

                // clinic
                try {
                    if (a.getClinicId() != null) {
                        Clinic c = clinicService.getClinicById(a.getClinicId()).orElse(null);
                        if (c != null) {
                            ar.clinic_name = c.getName();
                            ar.clinic_address = c.getAddressLine();
                            ar.clinic_type = c.getClinicType();
                        }
                    }
                } catch (Exception e) {
                    log.warn("getMyAppointments: failed to load clinic for id {}: {}", a.getClinicId(), e.getMessage());
                }

                // doctor
                try {
                    if (a.getDoctorId() != null) {
                        Doctor d = doctorService.getDoctorById(a.getDoctorId());
                        if (d != null) {
                            ar.doctor_name = d.getName();
                            ar.doctor_specialty = d.getSpecialty();
                        }
                    }
                } catch (Exception e) {
                    log.warn("getMyAppointments: failed to load doctor for id {}: {}", a.getDoctorId(), e.getMessage());
                }

                return ar;
            }).toList();

            log.info("getMyAppointments: returning {} enriched appointment responses", resp.size());
            return ResponseEntity.ok(resp);
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

