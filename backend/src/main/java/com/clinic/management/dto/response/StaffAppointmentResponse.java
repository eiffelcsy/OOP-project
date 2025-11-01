package com.clinic.management.dto.response;

import com.clinic.management.model.Appointment;
import com.clinic.management.model.Patient;
import com.clinic.management.model.Profile;
import com.clinic.management.model.Doctor;
import com.clinic.management.model.Clinic;

import java.time.OffsetDateTime;
import java.time.Duration;

/**
 * Enhanced appointment response DTO for staff views
 * Includes all necessary joined data to minimize frontend processing
 */
public class StaffAppointmentResponse {
    // Core appointment fields
    public Long id;
    public Long patientId;
    public Long doctorId;
    public Long clinicId;
    public OffsetDateTime startTime;
    public OffsetDateTime endTime;
    public String status;
    public String treatmentSummary;
    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
    
    // Enriched patient information
    public String patientName;
    public String patientPhone;
    
    // Enriched doctor information
    public String doctorName;
    public String doctorSpecialty;
    
    // Enriched clinic information
    public String clinicName;
    public String clinicType;
    public String clinicAddress;
    
    // Computed fields
    public Long durationMinutes;
    
    public StaffAppointmentResponse() {}
    
    /**
     * Factory method to create a StaffAppointmentResponse from an Appointment
     * with enriched data from related entities
     * 
     * @param appointment The appointment entity
     * @param patient The patient entity (nullable)
     * @param profile The user profile entity (nullable)
     * @param doctor The doctor entity (nullable)
     * @param clinic The clinic entity (nullable)
     * @return Fully populated StaffAppointmentResponse
     */
    public static StaffAppointmentResponse from(
            Appointment appointment,
            Patient patient,
            Profile profile,
            Doctor doctor,
            Clinic clinic) {
        
        StaffAppointmentResponse response = new StaffAppointmentResponse();
        
        // Core appointment fields
        response.id = appointment.getId();
        response.patientId = appointment.getPatientId();
        response.doctorId = appointment.getDoctorId();
        response.clinicId = appointment.getClinicId();
        response.startTime = appointment.getStartTime();
        response.endTime = appointment.getEndTime();
        response.status = appointment.getStatus();
        response.treatmentSummary = appointment.getTreatmentSummary();
        response.createdAt = appointment.getCreatedAt();
        response.updatedAt = appointment.getUpdatedAt();
        
        // Patient information
        if (profile != null) {
            response.patientName = profile.getFullName();
        } else {
            response.patientName = "-";
        }
        
        if (patient != null) {
            response.patientPhone = patient.getPhone() != null ? patient.getPhone() : "-";
        } else {
            response.patientPhone = "-";
        }
        
        // Doctor information
        if (doctor != null) {
            response.doctorName = doctor.getName();
            response.doctorSpecialty = doctor.getSpecialty();
        } else {
            response.doctorName = "-";
            response.doctorSpecialty = null;
        }
        
        // Clinic information
        if (clinic != null) {
            response.clinicName = clinic.getName();
            response.clinicType = clinic.getClinicType();
            response.clinicAddress = clinic.getAddressLine();
        } else {
            response.clinicName = "-";
            response.clinicType = "-";
            response.clinicAddress = null;
        }
        
        // Calculate duration
        if (appointment.getStartTime() != null && appointment.getEndTime() != null) {
            Duration duration = Duration.between(appointment.getStartTime(), appointment.getEndTime());
            response.durationMinutes = duration.toMinutes();
        } else {
            response.durationMinutes = null;
        }
        
        return response;
    }
}

