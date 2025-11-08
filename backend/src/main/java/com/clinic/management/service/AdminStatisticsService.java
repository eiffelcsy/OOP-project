package com.clinic.management.service;

import com.clinic.management.model.enums.QueueStatus;
import com.clinic.management.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import com.clinic.management.config.TimezoneConfig;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for generating system-wide statistics for admin dashboard
 * TODO: Implement actual statistics
 * - System health
 * - System status (uptime, database, backups)
 * - System load (cpu, memory, disk usage, network traffic)
 * - Calculate actual wait times from queue timestamps
 */
@Service
public class AdminStatisticsService {
    
    private final AppointmentRepository appointmentRepository;
    private final QueueRepository queueRepository;
    private final ProfileRepository profileRepository;
    private final ClinicRepository clinicRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    
    // Use central timezone config
    private static final java.time.ZoneId CLINIC_ZONE = TimezoneConfig.CLINIC_ZONE;
    
    @Autowired
    public AdminStatisticsService(
        AppointmentRepository appointmentRepository,
        QueueRepository queueRepository,
        ProfileRepository profileRepository,
        ClinicRepository clinicRepository,
        PatientRepository patientRepository,
        DoctorRepository doctorRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.queueRepository = queueRepository;
        this.profileRepository = profileRepository;
        this.clinicRepository = clinicRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }
    
    /**
     * Get comprehensive system statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSystemStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Key Metrics
        stats.put("metrics", getKeyMetrics());
        
        // System Status
        stats.put("system_status", getSystemStatus());
        
        // System Usage
        stats.put("system_usage", getSystemUsage());
        
        return stats;
    }
    
    /**
     * Get key metrics (total users, active clinics, system health)
     */
    @Transactional(readOnly = true)
    private Map<String, Object> getKeyMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        // Total users (from profiles table)
        long totalUsers = profileRepository.count();
        metrics.put("total_users", totalUsers);
        
        // Active clinics
        long activeClinics = clinicRepository.count();
        metrics.put("active_clinics", activeClinics);
        
        // System health - simplified for now
        metrics.put("system_health", "Healthy");
        metrics.put("health_status", "good");
        
        return metrics;
    }
    
    /**
     * Get system status (uptime, database, backups)
     */
    @Transactional(readOnly = true)
    private Map<String, Object> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();
        
        // For now, we'll return basic status
        // In production, you might integrate with actual monitoring tools
        status.put("server_uptime", "99.9%");
        status.put("uptime_days", 127);
        status.put("database_connectivity", "Connected");
        status.put("db_status", "good");
        status.put("last_backup", "2 hours ago");
        
        // Count active database connections (approximate using patient count as proxy)
        // In production, you'd query actual connection pools
        long activeConnections = patientRepository.count() + doctorRepository.count();
        status.put("active_connections", activeConnections);
        
        return status;
    }
    
    /**
     * Get system usage statistics (appointments, queue, etc.)
     */
    @Transactional(readOnly = true)
    private Map<String, Object> getSystemUsage() {
        Map<String, Object> usage = new HashMap<>();
        
        ZonedDateTime now = ZonedDateTime.now(CLINIC_ZONE);
        OffsetDateTime todayStart = now.toLocalDate().atStartOfDay(CLINIC_ZONE).toOffsetDateTime();
        OffsetDateTime todayEnd = now.toLocalDate().plusDays(1).atStartOfDay(CLINIC_ZONE).toOffsetDateTime();
        
        OffsetDateTime weekStart = now.minusWeeks(1).toOffsetDateTime();
        OffsetDateTime lastWeekStart = now.minusWeeks(2).toOffsetDateTime();
        OffsetDateTime lastWeekEnd = now.minusWeeks(1).toOffsetDateTime();
        
        long appointmentsToday = appointmentRepository.findAll().stream()
            .filter(a -> {
                OffsetDateTime startTime = a.getStartTime();
                return startTime != null && 
                       !startTime.isBefore(todayStart) && 
                       startTime.isBefore(todayEnd);
            })
            .count();
        usage.put("appointments_today", appointmentsToday);
        
        long appointmentsThisWeek = appointmentRepository.findAll().stream()
            .filter(a -> {
                OffsetDateTime startTime = a.getStartTime();
                return startTime != null && !startTime.isBefore(weekStart);
            })
            .count();
        usage.put("appointments_this_week", appointmentsThisWeek);
        
        long appointmentsLastWeek = appointmentRepository.findAll().stream()
            .filter(a -> {
                OffsetDateTime startTime = a.getStartTime();
                return startTime != null && 
                       !startTime.isBefore(lastWeekStart) && 
                       startTime.isBefore(lastWeekEnd);
            })
            .count();
        
        double trend = appointmentsLastWeek > 0 
            ? ((double)(appointmentsThisWeek - appointmentsLastWeek) / appointmentsLastWeek * 100)
            : 0;
        String trendStr = String.format("%+.1f%%", trend);
        usage.put("appointments_trend", trendStr);
        
        long cancellationsToday = appointmentRepository.findAll().stream()
            .filter(a -> {
                OffsetDateTime startTime = a.getStartTime();
                return "cancelled".equals(a.getStatus()) &&
                       startTime != null && 
                       !startTime.isBefore(todayStart) && 
                       startTime.isBefore(todayEnd);
            })
            .count();
        usage.put("cancellations_today", cancellationsToday);
        
        // Cancellation rate
        double cancellationRate = appointmentsToday > 0 
            ? ((double)cancellationsToday / appointmentsToday * 100)
            : 0;
        usage.put("cancellation_rate", String.format("%.1f%%", cancellationRate));
        
        // Queue statistics
        Map<String, Object> queueStats = getQueueStatistics();
        usage.put("queue_stats", queueStats);
        
        // System load (placeholder - in production, integrate with actual monitoring)
        Map<String, Object> systemLoad = new HashMap<>();
        systemLoad.put("cpu", 23);
        systemLoad.put("memory", 67);
        systemLoad.put("disk_usage", 45);
        systemLoad.put("network_traffic", "Normal");
        usage.put("system_load", systemLoad);
        
        return usage;
    }
    
    /**
     * Get queue-specific statistics
     */
    @Transactional(readOnly = true)
    private Map<String, Object> getQueueStatistics() {
        Map<String, Object> queueStats = new HashMap<>();
        
        // Current waiting (active queues)
        long currentWaiting = queueRepository.countByQueueStatus(QueueStatus.ACTIVE);
        queueStats.put("current_waiting", currentWaiting);
        
        // Average wait time - simplified calculation
        // In production, you'd calculate actual wait times from queue timestamps
        String averageWaitTime = currentWaiting > 30 ? "20 min" : "15 min";
        queueStats.put("average_wait_time", averageWaitTime);
        
        // Longest wait
        String longestWait = currentWaiting > 50 ? "60 min" : "45 min";
        queueStats.put("longest_wait", longestWait);
        
        // Queue status
        String queueStatus;
        if (currentWaiting > 50) {
            queueStatus = "critical";
        } else if (currentWaiting > 30) {
            queueStatus = "busy";
        } else {
            queueStatus = "normal";
        }
        queueStats.put("queue_status", queueStatus);
        
        return queueStats;
    }
    
    /**
     * Get new registrations count for a time period
     */
    @Transactional(readOnly = true)
    public long getNewRegistrations(int hours) {
        LocalDateTime cutoff = LocalDateTime.now(CLINIC_ZONE).minusHours(hours);
        
        return patientRepository.findAll().stream()
            .filter(p -> p.getCreatedAt() != null)
            .filter(p -> p.getCreatedAt().isAfter(cutoff))
            .count();
    }
}

