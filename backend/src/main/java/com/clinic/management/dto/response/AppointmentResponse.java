package com.clinic.management.dto.response;

import com.clinic.management.model.Appointment;

import java.time.OffsetDateTime;

public class AppointmentResponse {
    public Long id;
    public Long patient_id;
    public Long doctor_id;
    public Long clinic_id;
    public OffsetDateTime start_time;
    public OffsetDateTime end_time;
    public String treatment_summary;
    public String status;
    public OffsetDateTime created_at;
    public OffsetDateTime updated_at;

    // Clinic info
    public String clinic_name;
    public String clinic_address;
    public String clinic_type;

    // Doctor info
    public String doctor_name;
    public String doctor_specialty;

    public AppointmentResponse() {}
    
    /**
     * Create AppointmentResponse from Appointment entity (basic fields only)
     * Clinic and doctor info should be populated separately if needed
     * @param appointment Appointment entity
     * @return AppointmentResponse DTO with basic fields populated
     */
    public static AppointmentResponse from(Appointment appointment) {
        if (appointment == null) return null;
        AppointmentResponse response = new AppointmentResponse();
        response.id = appointment.getId();
        response.patient_id = appointment.getPatientId();
        response.doctor_id = appointment.getDoctorId();
        response.clinic_id = appointment.getClinicId();
        response.start_time = appointment.getStartTime();
        response.end_time = appointment.getEndTime();
        response.treatment_summary = appointment.getTreatmentSummary();
        response.status = appointment.getStatus();
        response.created_at = appointment.getCreatedAt();
        response.updated_at = appointment.getUpdatedAt();
        return response;
    }
}
