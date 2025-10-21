package com.clinic.management.scheduling;

import com.clinic.management.model.Appointment;
import com.clinic.management.repository.AppointmentRepository;
import com.clinic.management.config.TimezoneConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.List;

/**
 * Scheduler that promotes appointments from 'scheduled' to 'confirmed' when the
 * appointment start time is within the next 24 hours.
 */
@Component
public class AppointmentConfirmationScheduler {
    private static final Logger log = LoggerFactory.getLogger(AppointmentConfirmationScheduler.class);
    private final AppointmentRepository repository;

    public AppointmentConfirmationScheduler(AppointmentRepository repository) {
        this.repository = repository;
    }

    // run every 15 minutes (900_000 ms)
    @Scheduled(fixedDelay = 900000)
    @Transactional
    public void confirmUpcomingAppointments() {
        try {
            ZonedDateTime nowZ = ZonedDateTime.now(TimezoneConfig.CLINIC_ZONE);
            OffsetDateTime now = nowZ.toOffsetDateTime();
            OffsetDateTime in24 = nowZ.plusHours(24).toOffsetDateTime();

            log.debug("AppointmentConfirmationScheduler: checking appointments between {} and {}", now, in24);

            List<Appointment> candidates = repository.findByStatusAndStartTimeBetween("scheduled", now, in24);
            log.info("AppointmentConfirmationScheduler: found {} scheduled appointments within 24 hours", candidates == null ? 0 : candidates.size());
            if (candidates == null || candidates.isEmpty()) {
                log.debug("No scheduled appointments within 24 hours to confirm");
                return;
            }

            int confirmed = 0;
            for (Appointment a : candidates) {
                // Double-check start time is within range (defensive)
                OffsetDateTime s = a.getStartTime();
                if (s != null && !s.isBefore(now) && !s.isAfter(in24)) {
                    a.setStatus("confirmed");
                    a.setUpdatedAt(ZonedDateTime.now(TimezoneConfig.CLINIC_ZONE).toOffsetDateTime());
                    repository.save(a);
                    log.info("Confirmed appointment id={}", a.getId());
                    confirmed++;
                }
            }
            log.info("AppointmentConfirmationScheduler: confirmed {} appointments", confirmed);
        } catch (Exception ex) {
            log.error("Error while confirming upcoming appointments", ex);
        }
    }
}
