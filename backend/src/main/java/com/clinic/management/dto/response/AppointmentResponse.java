package com.clinic.management.dto.response;

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
}
