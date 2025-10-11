package com.clinic.management.service;

import com.clinic.management.model.Appointment;
import com.clinic.management.repository.AppointmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository repository;

    public AppointmentService(AppointmentRepository repository) {
        this.repository = repository;
    }

    public List<Appointment> getAppointments(Long doctorId, Long clinicId, String status) {
        if (doctorId != null) return repository.findByDoctorId(doctorId);
        if (clinicId != null) return repository.findByClinicId(clinicId);
        if (status != null) return repository.findByStatus(status);
        return repository.findAll();
    }

    public Appointment addAppointment(Appointment appointment) {
        appointment.setStatus("scheduled");
        return repository.save(appointment);
    }

    public void cancelAppointment(Long id) {
        Appointment appointment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus("cancelled");
        repository.save(appointment);
    }

    public Appointment rescheduleAppointment(Long id, Long newTimeSlotId) {
        Appointment appointment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setTimeSlotId(newTimeSlotId);
        return repository.save(appointment);
    }
}
