package com.clinic.management.service;

import com.clinic.management.model.Appointment;
import com.clinic.management.model.Schedule;
import com.clinic.management.repository.AppointmentRepository;
import com.clinic.management.repository.ScheduleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

/**
 * Service for managing appointments. Adds validation to ensure requested
 * intervals are within doctor schedules and do not overlap existing appointments.
 */

@Service
public class AppointmentService {

    private final AppointmentRepository repository;
    private final ScheduleRepository scheduleRepository;

    public AppointmentService(AppointmentRepository repository, ScheduleRepository scheduleRepository) {
        this.repository = repository;
        this.scheduleRepository = scheduleRepository;
    }

    public List<Appointment> getAppointments(Long doctorId, Long clinicId, String status) {
        if (doctorId != null) return repository.findByDoctorId(doctorId);
        if (clinicId != null) return repository.findByClinicId(clinicId);
        if (status != null) return repository.findByStatus(status);
        return repository.findAll();
    }

    public Appointment addAppointment(Appointment appointment) {
        // Basic validation
        if (appointment.getDoctorId() == null) throw new IllegalArgumentException("doctorId is required");
        if (appointment.getStartTime() == null || appointment.getEndTime() == null) throw new IllegalArgumentException("startTime and endTime are required");
        if (!appointment.getStartTime().isBefore(appointment.getEndTime())) throw new IllegalArgumentException("startTime must be before endTime");

        // Check schedule - convert startTime to doctor's local time-of-day check
        OffsetDateTime start = appointment.getStartTime();
        ZonedDateTime zstart = start.atZoneSameInstant(ZoneId.systemDefault());
        int weekday = zstart.getDayOfWeek().getValue(); // 1 (Mon) - 7 (Sun)
        LocalTime timeOfDayStart = zstart.toLocalTime();
        LocalTime timeOfDayEnd = appointment.getEndTime().atZoneSameInstant(ZoneId.systemDefault()).toLocalTime();

        List<Schedule> schedules = scheduleRepository.findByDoctorIdAndDayOfWeek(appointment.getDoctorId(), weekday);
        boolean fitsSchedule = false;
        for (Schedule s : schedules) {
            // Schedule stores LocalTime for start/end so use them directly
            LocalTime sStart = s.getStartTime();
            LocalTime sEnd = s.getEndTime();
            if (!timeOfDayStart.isBefore(sStart) && !timeOfDayEnd.isAfter(sEnd)) {
                fitsSchedule = true;
                break;
            }
        }
        if (!fitsSchedule) throw new IllegalArgumentException("Requested time is outside doctor's schedule");

        // Check overlapping scheduled appointments
        long conflicts = repository.countOverlapping(appointment.getDoctorId(), appointment.getStartTime(), appointment.getEndTime());
        if (conflicts > 0) throw new IllegalStateException("Requested time overlaps an existing appointment");

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
        // For migration compatibility, keep existing method
        appointment.setTimeSlotId(newTimeSlotId);
        return repository.save(appointment);
    }

    // New reschedule by start/end timestamps
    public Appointment rescheduleAppointment(Long id, OffsetDateTime newStart, OffsetDateTime newEnd) {
        Appointment appointment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStartTime(newStart);
        appointment.setEndTime(newEnd);

        // Reuse validation by delegating to addAppointment-like checks
        // Temporarily clear id so addAppointment treats it as new? Simpler: run checks inline
        long conflicts = repository.countOverlapping(appointment.getDoctorId(), newStart, newEnd);
        if (conflicts > 0) throw new IllegalStateException("Requested time overlaps an existing appointment");

        return repository.save(appointment);
    }
}
