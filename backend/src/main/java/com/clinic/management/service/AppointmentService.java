package com.clinic.management.service;

import com.clinic.management.model.Appointment;
import com.clinic.management.model.Schedule;
import com.clinic.management.repository.AppointmentRepository;
import com.clinic.management.repository.ScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import com.clinic.management.config.TimezoneConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service for managing appointments. Adds validation to ensure requested
 * intervals are within doctor schedules and do not overlap existing appointments.
 */

@Service
public class AppointmentService {

    private final AppointmentRepository repository;
    private final ScheduleRepository scheduleRepository;
    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

    public AppointmentService(AppointmentRepository repository, ScheduleRepository scheduleRepository) {
        this.repository = repository;
        this.scheduleRepository = scheduleRepository;
    }

    @Transactional(readOnly = true)
    public List<Appointment> getAppointments(Long doctorId, Long clinicId, String status) {
        // Reconcile scheduled -> confirmed for the requested scope before returning results
        try {
            reconcileUpcomingAppointments(clinicId, doctorId, null);
        } catch (Exception ex) {
            log.warn("reconcileUpcomingAppointments failed during getAppointments", ex);
        }

        if (doctorId != null) return repository.findByDoctorId(doctorId);
        if (clinicId != null) return repository.findByClinicId(clinicId);
        if (status != null) return repository.findByStatus(status);
        return repository.findAll();
    }

    /**
     * Reconcile scheduled appointments that start within the next 24 hours and
     * mark them as confirmed. If clinicId/doctorId/patientId are provided, only
     * appointments matching those values are updated.
     */
    @Transactional
    public void reconcileUpcomingAppointments(Long clinicId, Long doctorId, Long patientId) {
        ZonedDateTime nowZ = ZonedDateTime.now(TimezoneConfig.CLINIC_ZONE);
        OffsetDateTime now = nowZ.toOffsetDateTime();
        OffsetDateTime in24 = nowZ.plusHours(24).toOffsetDateTime();

        List<Appointment> candidates = repository.findByStatusAndStartTimeBetween("scheduled", now, in24);
        if (candidates == null || candidates.isEmpty()) return;

        int matched = candidates.size();
        int updated = 0;

        for (Appointment a : candidates) {
            if (a.getStartTime() == null) continue;
            if (clinicId != null && (a.getClinicId() == null || !a.getClinicId().equals(clinicId))) continue;
            if (doctorId != null && (a.getDoctorId() == null || !a.getDoctorId().equals(doctorId))) continue;
            if (patientId != null && (a.getPatientId() == null || !a.getPatientId().equals(patientId))) continue;

            OffsetDateTime s = a.getStartTime();
            if (!s.isBefore(now) && !s.isAfter(in24)) {
                a.setStatus("confirmed");
                a.setUpdatedAt(ZonedDateTime.now(TimezoneConfig.CLINIC_ZONE).toOffsetDateTime());
                repository.save(a);
                updated++;
                log.info("Reconciled appointment id={} to confirmed", a.getId());
            }
        }
        log.info("reconcileUpcomingAppointments: matched={} updated={}", matched, updated);
    }

    @Transactional
    public Appointment addAppointment(Appointment appointment) {
        // Basic validation
        if (appointment.getDoctorId() == null) throw new IllegalArgumentException("doctorId is required");
        if (appointment.getStartTime() == null || appointment.getEndTime() == null) throw new IllegalArgumentException("startTime and endTime are required");
        if (!appointment.getStartTime().isBefore(appointment.getEndTime())) throw new IllegalArgumentException("startTime must be before endTime");

        // Check schedule - convert startTime to doctor's local time-of-day check
    OffsetDateTime start = appointment.getStartTime();
    // Convert times to the clinic local zone before extracting weekday and local time
    final java.time.ZoneId clinicZone = TimezoneConfig.CLINIC_ZONE;
    ZonedDateTime zstart = start.atZoneSameInstant(clinicZone);
    int weekday = zstart.getDayOfWeek().getValue(); // 1 (Mon) - 7 (Sun)
    LocalTime timeOfDayStart = zstart.toLocalTime();
    LocalTime timeOfDayEnd = appointment.getEndTime().atZoneSameInstant(clinicZone).toLocalTime();

        // Prefer date-aware schedule lookup so valid_from/valid_to are respected
        java.time.LocalDate apptDate = zstart.toLocalDate();
        List<Schedule> schedules = scheduleRepository.findValidSchedulesForDate(appointment.getDoctorId(), apptDate);

        boolean fitsSchedule = false;
        if (schedules == null || schedules.isEmpty()) {
            log.warn("No schedules found for doctor={} on weekday={} date={}", appointment.getDoctorId(), weekday, apptDate);
        } else {
            log.debug("Checking {} schedule rows for doctor={} on {}", schedules.size(), appointment.getDoctorId(), apptDate);
        }

        for (Schedule s : schedules) {
            // Schedule stores LocalTime for start/end. Historically some schedules
            // were stored as UTC-of-day in the backend DB. To be robust, convert
            // the stored LocalTime (treated as UTC-of-day) to the clinic local
            // time before comparing to the requested local times.
            LocalTime sStartUtc = s.getStartTime();
            LocalTime sEndUtc = s.getEndTime();

            java.time.ZonedDateTime zSStart = java.time.ZonedDateTime.of(apptDate, sStartUtc, java.time.ZoneOffset.UTC).withZoneSameInstant(clinicZone);
            java.time.ZonedDateTime zSEnd = java.time.ZonedDateTime.of(apptDate, sEndUtc, java.time.ZoneOffset.UTC).withZoneSameInstant(clinicZone);

            LocalTime sStartLocal = zSStart.toLocalTime();
            LocalTime sEndLocal = zSEnd.toLocalTime();

            log.debug("Comparing requested {}-{} against schedule (UTC) {}-{} -> (SGT) {}-{} (scheduleId={})",
                    timeOfDayStart, timeOfDayEnd, sStartUtc, sEndUtc, sStartLocal, sEndLocal, s.getId());

            if (!timeOfDayStart.isBefore(sStartLocal) && !timeOfDayEnd.isAfter(sEndLocal)) {
                fitsSchedule = true;
                break;
            }
        }

        if (!fitsSchedule) {
            String msg = String.format("Requested time %s - %s (sgt date=%s, weekday=%d) is outside doctor's schedule (no matching schedule row)",
                    timeOfDayStart, timeOfDayEnd, apptDate, weekday);
            log.warn(msg + "; schedulesCount=" + (schedules == null ? 0 : schedules.size()));
            throw new IllegalArgumentException(msg);
        }

        // Check overlapping scheduled appointments
        long conflicts = repository.countOverlapping(appointment.getDoctorId(), appointment.getStartTime(), appointment.getEndTime());
        if (conflicts > 0) throw new IllegalStateException("Requested time overlaps an existing appointment");

        // Set status and timestamps at creation time (use clinic timezone)
        OffsetDateTime now = ZonedDateTime.now(clinicZone).toOffsetDateTime();
    appointment.setStatus("scheduled");
        // If createdAt/updatedAt are not provided, set them to current time
        appointment.setCreatedAt(appointment.getCreatedAt() == null ? now : appointment.getCreatedAt());
        appointment.setUpdatedAt(now);

        return repository.save(appointment);
    }

    @Transactional
    public void cancelAppointment(Long id) {
        Appointment appointment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus("cancelled");
    appointment.setUpdatedAt(ZonedDateTime.now(TimezoneConfig.CLINIC_ZONE).toOffsetDateTime());
        repository.save(appointment);
    }

    @Transactional
    public Appointment rescheduleAppointment(Long id, Long newTimeSlotId) {
        Appointment appointment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        // For migration compatibility, keep existing method
        appointment.setTimeSlotId(newTimeSlotId);
        return repository.save(appointment);
    }

    // New reschedule by start/end timestamps
    @Transactional
    public Appointment rescheduleAppointment(Long id, OffsetDateTime newStart, OffsetDateTime newEnd) {
        Appointment appointment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStartTime(newStart);
        appointment.setEndTime(newEnd);

        // Reuse validation by delegating to addAppointment-like checks
        // Temporarily clear id so addAppointment treats it as new? Simpler: run checks inline
        long conflicts = repository.countOverlapping(appointment.getDoctorId(), newStart, newEnd);
        if (conflicts > 0) throw new IllegalStateException("Requested time overlaps an existing appointment");

    appointment.setUpdatedAt(ZonedDateTime.now(TimezoneConfig.CLINIC_ZONE).toOffsetDateTime());
        return repository.save(appointment);
    }

    // Fetch appointments belonging to a patient
    @Transactional(readOnly = true)
    public List<Appointment> getAppointmentsByPatientId(Long patientId) {
        try {
            if (patientId == null) {
                log.debug("getAppointmentsByPatientId: received null patientId");
                return List.of();
            }
            // Reconcile upcoming appointments for this patient before returning
            try {
                reconcileUpcomingAppointments(null, null, patientId);
            } catch (Exception ex) {
                log.warn("reconcileUpcomingAppointments failed during getAppointmentsByPatientId", ex);
            }

            List<Appointment> result = repository.findByPatientId(patientId);
            log.debug("getAppointmentsByPatientId: patientId={} returned {} rows", patientId, result.size());
            return result;
        } catch (Exception ex) {
            log.error("getAppointmentsByPatientId: unexpected error", ex);
            return List.of();
        }
    }
}
