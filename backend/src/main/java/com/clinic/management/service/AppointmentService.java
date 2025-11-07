package com.clinic.management.service;

import com.clinic.management.model.Appointment;
import com.clinic.management.model.Schedule;
import com.clinic.management.repository.AppointmentRepository;
import com.clinic.management.repository.ScheduleRepository;
import com.clinic.management.repository.PatientRepository;
import com.clinic.management.repository.ProfileRepository;
import com.clinic.management.repository.DoctorRepository;
import com.clinic.management.repository.ClinicRepository;
import com.clinic.management.model.Patient;
import com.clinic.management.model.Profile;
import com.clinic.management.model.Doctor;
import com.clinic.management.model.Clinic;
import com.clinic.management.dto.response.StaffAppointmentResponse;
import java.util.Optional;
import java.util.Objects;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDate;
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
 * intervals are within doctor schedules and do not overlap existing
 * appointments.
 */

@Service
public class AppointmentService {

    private final AppointmentRepository repository;
    private final ScheduleRepository scheduleRepository;
    private final PatientRepository patientRepository;
    private final ProfileRepository profileRepository;
    private final DoctorRepository doctorRepository;
    private final ClinicRepository clinicRepository;
    private final EmailService emailService;
    private final ClinicService clinicService;
    private final DoctorService doctorService;
    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

    public AppointmentService(AppointmentRepository repository, ScheduleRepository scheduleRepository,
                              PatientRepository patientRepository, ProfileRepository profileRepository,
                              DoctorRepository doctorRepository, ClinicRepository clinicRepository,
                              EmailService emailService, ClinicService clinicService, DoctorService doctorService) {
        this.repository = repository;
        this.scheduleRepository = scheduleRepository;
        this.patientRepository = patientRepository;
        this.profileRepository = profileRepository;
        this.doctorRepository = doctorRepository;
        this.clinicRepository = clinicRepository;
        this.emailService = emailService;
        this.clinicService = clinicService;
        this.doctorService = doctorService;
    }

    @Transactional(readOnly = true)
    public List<Appointment> getAppointments(Long doctorId, Long clinicId, String status) {
        // Reconcile scheduled -> confirmed for the requested scope before returning
        // results
        try {
            reconcileUpcomingAppointments(clinicId, doctorId, null);
        } catch (Exception ex) {
            log.warn("reconcileUpcomingAppointments failed during getAppointments", ex);
        }

        if (doctorId != null)
            return repository.findByDoctorId(doctorId);
        if (clinicId != null)
            return repository.findByClinicId(clinicId);
        if (status != null)
            return repository.findByStatus(status);
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
        if (candidates == null || candidates.isEmpty())
            return;

        int matched = candidates.size();
        int updated = 0;

        for (Appointment a : candidates) {
            if (a.getStartTime() == null)
                continue;
            if (clinicId != null && (a.getClinicId() == null || !a.getClinicId().equals(clinicId)))
                continue;
            if (doctorId != null && (a.getDoctorId() == null || !a.getDoctorId().equals(doctorId)))
                continue;
            if (patientId != null && (a.getPatientId() == null || !a.getPatientId().equals(patientId)))
                continue;

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
        if (appointment.getDoctorId() == null)
            throw new IllegalArgumentException("doctorId is required");
        if (appointment.getStartTime() == null || appointment.getEndTime() == null)
            throw new IllegalArgumentException("startTime and endTime are required");
        if (!appointment.getStartTime().isBefore(appointment.getEndTime()))
            throw new IllegalArgumentException("startTime must be before endTime");

        // Check schedule - convert startTime to doctor's local time-of-day check
        OffsetDateTime start = appointment.getStartTime();
        // Convert times to the clinic local zone before extracting weekday and local
        // time
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
            log.warn("No schedules found for doctor={} on weekday={} date={}", appointment.getDoctorId(), weekday,
                    apptDate);
        } else {
            log.debug("Checking {} schedule rows for doctor={} on {}", schedules.size(), appointment.getDoctorId(),
                    apptDate);
        }

        for (Schedule s : schedules) {
        // Schedule stores LocalTime for start/end. These times are stored
        // in the clinic's local wall-clock time (Asia/Singapore). Interpret
        // the stored LocalTime directly as clinic-local (no UTC conversion)
        // when comparing to the requested times.
        LocalTime sStartLocal = s.getStartTime();
        LocalTime sEndLocal = s.getEndTime();

        log.debug("Comparing requested {}-{} against schedule (SGT) {}-{} (scheduleId={})",
            timeOfDayStart, timeOfDayEnd, sStartLocal, sEndLocal, s.getId());

            if (!timeOfDayStart.isBefore(sStartLocal) && !timeOfDayEnd.isAfter(sEndLocal)) {
                fitsSchedule = true;
                break;
            }
        }

        if (!fitsSchedule) {
            String msg = String.format(
                    "Requested time %s - %s (sgt date=%s, weekday=%d) is outside doctor's schedule (no matching schedule row)",
                    timeOfDayStart, timeOfDayEnd, apptDate, weekday);
            log.warn(msg + "; schedulesCount=" + (schedules == null ? 0 : schedules.size()));
            throw new IllegalArgumentException(msg);
        }

        // Check overlapping scheduled appointments
        long conflicts = repository.countOverlapping(appointment.getDoctorId(), appointment.getStartTime(),
                appointment.getEndTime());
        if (conflicts > 0)
            throw new IllegalStateException("Requested time overlaps an existing appointment");

        // Set status and timestamps at creation time (use clinic timezone)
        OffsetDateTime now = ZonedDateTime.now(clinicZone).toOffsetDateTime();
        appointment.setStatus("scheduled");
        // If createdAt/updatedAt are not provided, set them to current time
        appointment.setCreatedAt(appointment.getCreatedAt() == null ? now : appointment.getCreatedAt());
        appointment.setUpdatedAt(now);

        Appointment saved = repository.save(appointment);

        // Attempt to send notification email to patient (if we can resolve an email
        // address)
        try {
            if (saved.getPatientId() != null) {
                Optional<Patient> pOpt = patientRepository.findById(saved.getPatientId());
                if (pOpt.isPresent()) {
                    Patient p = pOpt.get();
                    String userId = p.getUserId();
                    if (userId != null) {
                        Optional<Profile> prof = profileRepository.findByUserId(userId);
                        if (prof.isPresent() && prof.get().getEmail() != null && !prof.get().getEmail().isBlank()) {
                            String to = prof.get().getEmail();
                            String name = prof.get().getFullName();
                            // Send email asynchronously in a best-effort manner
                            try {
                                // Enrich with clinic and doctor names when available
                                String clinicName = null;
                                String doctorName = null;
                                try {
                                    if (saved.getClinicId() != null) {
                                        clinicName = clinicService.getClinicById(saved.getClinicId())
                                                .map(c -> c.getName()).orElse(null);
                                    }
                                } catch (Exception _e) {
                                }
                                try {
                                    if (saved.getDoctorId() != null) {
                                        doctorName = doctorService.getDoctorById(saved.getDoctorId()).getName();
                                    }
                                } catch (Exception _e) {
                                }

                                emailService.sendAppointmentScheduledEmail(saved, to, name, clinicName, doctorName);
                            } catch (Exception e) {
                                log.warn("Failed to send appointment email for appointment id={}", saved.getId(), e);
                            }
                        } else {
                            log.debug("No profile/email found for patient userId={}", userId);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error while attempting to send appointment notification email for appointment id={}",
                    saved.getId(), e);
        }

        return saved;
    }

    /**
     * Debug helper: return schedule rows and overlap count for a proposed appointment
     * This is useful for frontend debugging when a requested slot is rejected.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> debugCheckAppointment(Long doctorId, OffsetDateTime start, OffsetDateTime end) {
    final java.time.ZoneId clinicZone = TimezoneConfig.CLINIC_ZONE;
    java.time.ZonedDateTime zstart = start.atZoneSameInstant(clinicZone);
    java.time.LocalDate apptDate = zstart.toLocalDate();
    int weekday = zstart.getDayOfWeek().getValue();

    List<Schedule> schedules = scheduleRepository.findValidSchedulesForDate(doctorId, apptDate);

    List<Map<String, Object>> scheduleRows = schedules.stream().map(s -> {
        java.time.LocalTime sStartLocal = s.getStartTime();
        java.time.LocalTime sEndLocal = s.getEndTime();

        java.util.Map<String, Object> row = new java.util.HashMap<>();
        row.put("scheduleId", s.getId());
        row.put("storedStartLocal", sStartLocal.toString());
        row.put("storedEndLocal", sEndLocal.toString());
        row.put("startLocal", sStartLocal.toString());
        row.put("endLocal", sEndLocal.toString());
        row.put("validFrom", s.getValidFrom());
        row.put("validTo", s.getValidTo());
        row.put("dayOfWeek", s.getDayOfWeek());
        return row;
    }).collect(Collectors.toList());

    long conflicts = repository.countOverlapping(doctorId, start, end);

    Map<String, Object> out = Map.of(
        "doctorId", doctorId,
        "apptDate", apptDate.toString(),
        "weekday", weekday,
        "startLocal", zstart.toLocalTime().toString(),
        "endLocal", end.atZoneSameInstant(clinicZone).toLocalTime().toString(),
        "schedules", scheduleRows,
        "conflicts", conflicts
    );

    return out;
    }

    /**
     * Return whether EmailService is configured (useful for controllers to signal
     * client)
     */
    public boolean isEmailConfigured() {
        try {
            return emailService != null && emailService.isConfigured();
        } catch (Exception e) {
            return false;
        }
    }

    /* reschedule */
    @Transactional
    public Appointment rescheduleAppointment(Long id, OffsetDateTime newStart, OffsetDateTime newEnd) {
        System.out.println("=== RESCHEDULE START ===");
        System.out.println("Rescheduling appointment id=" + id);
        System.out.println("New times - start: " + newStart + ", end: " + newEnd);

        Appointment appointment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        System.out.println("Found appointment:");
        System.out.println("  - Current times: " + appointment.getStartTime() + " to " + appointment.getEndTime());
        System.out.println("  - Doctor ID: " + appointment.getDoctorId());
        System.out.println("  - Status: " + appointment.getStatus());

        if (!newStart.isBefore(newEnd)) {
            throw new IllegalArgumentException("newStart must be before newEnd");
        }

        // TEMPORARY: Skip overlap check for now
        System.out.println("TEMPORARILY SKIPPING OVERLAP CHECK");

        // Update appointment
        appointment.setStartTime(newStart);
        appointment.setEndTime(newEnd);
        appointment.setStatus("scheduled");
        appointment.setUpdatedAt(ZonedDateTime.now(TimezoneConfig.CLINIC_ZONE).toOffsetDateTime());

        Appointment saved = repository.save(appointment);
        System.out.println("Successfully rescheduled appointment id=" + saved.getId());
        System.out.println("New times: " + saved.getStartTime() + " to " + saved.getEndTime());
        System.out.println("=== RESCHEDULE COMPLETED SUCCESSFULLY ===");

        return saved;
    }

    @Transactional
    public void cancelAppointment(Long id) {
        Appointment appointment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus("cancelled");
        appointment.setUpdatedAt(ZonedDateTime.now(TimezoneConfig.CLINIC_ZONE).toOffsetDateTime());
        repository.save(appointment);
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

    /**
     * Get today's appointments for a clinic with enriched data
     * This method returns appointments with patient names, doctor names, clinic info, etc.
     * Filters appointments to only show those scheduled for today (in Asia/Singapore timezone)
     * 
     * @param clinicId Clinic ID
     * @return List of enriched appointments for today
     */
    @Transactional(readOnly = true)
    public List<StaffAppointmentResponse> getTodaysAppointmentsForClinic(Long clinicId) {
        // Get today's date in clinic timezone (Asia/Singapore)
        ZonedDateTime nowInClinicZone = ZonedDateTime.now(TimezoneConfig.CLINIC_ZONE);
        LocalDate today = nowInClinicZone.toLocalDate();
        
        // Fetch all appointments for the clinic
        List<Appointment> allAppointments = getAppointments(null, clinicId, null);
        
        // Filter to today's appointments (comparing dates in clinic timezone)
        List<Appointment> todaysAppointments = allAppointments.stream()
            .filter(appt -> {
                if (appt.getStartTime() == null) return false;
                ZonedDateTime apptInClinicZone = appt.getStartTime().atZoneSameInstant(TimezoneConfig.CLINIC_ZONE);
                LocalDate apptDate = apptInClinicZone.toLocalDate();
                return apptDate.equals(today);
            })
            .collect(Collectors.toList());
        
        // Collect all unique IDs we need to fetch
        List<Long> patientIds = todaysAppointments.stream()
            .map(Appointment::getPatientId)
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());
        
        List<Long> doctorIds = todaysAppointments.stream()
            .map(Appointment::getDoctorId)
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());
        
        List<Long> clinicIds = todaysAppointments.stream()
            .map(Appointment::getClinicId)
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());
        
        // Fetch all related entities in bulk
        List<Patient> patients = patientIds.isEmpty() ? List.of() : patientRepository.findByIdIn(patientIds);
        List<Doctor> doctors = doctorIds.isEmpty() ? List.of() : doctorRepository.findAllById(doctorIds);
        List<Clinic> clinics = clinicIds.isEmpty() ? List.of() : clinicRepository.findAllById(clinicIds);
        
        // Fetch profiles for all user IDs
        List<String> userIds = patients.stream()
            .map(Patient::getUserId)
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());
        
        List<Profile> profiles = userIds.isEmpty() ? List.of() : profileRepository.findByUserIdIn(userIds);
        
        // Build lookup maps for efficient access
        Map<Long, Patient> patientMap = patients.stream()
            .collect(Collectors.toMap(Patient::getId, p -> p));
        
        Map<String, Profile> profileMap = profiles.stream()
            .collect(Collectors.toMap(Profile::getUserId, p -> p));
        
        Map<Long, Doctor> doctorMap = doctors.stream()
            .collect(Collectors.toMap(Doctor::getDoctorId, d -> d));
        
        Map<Long, Clinic> clinicMap = clinics.stream()
            .collect(Collectors.toMap(Clinic::getId, c -> c));
        
        // Build enriched responses
        List<StaffAppointmentResponse> responses = todaysAppointments.stream()
            .map(appt -> {
                Patient patient = patientMap.get(appt.getPatientId());
                Profile profile = null;
                if (patient != null && patient.getUserId() != null) {
                    profile = profileMap.get(patient.getUserId());
                }
                Doctor doctor = doctorMap.get(appt.getDoctorId());
                Clinic clinic = clinicMap.get(appt.getClinicId());
                
                return StaffAppointmentResponse.from(appt, patient, profile, doctor, clinic);
            })
            .collect(Collectors.toList());
        
        return responses;
    }
}
