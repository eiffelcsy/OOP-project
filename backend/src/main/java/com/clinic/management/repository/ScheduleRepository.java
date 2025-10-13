package com.clinic.management.repository;

import com.clinic.management.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for Schedule entity.
 * Provides methods to query doctor schedules for appointment slot generation.
 */
@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    /**
     * Find all schedules for a specific doctor
     * @param doctorId The doctor's ID
     * @return List of schedules for the doctor
     */
    List<Schedule> findByDoctorId(Long doctorId);

    /**
     * Find schedules for a specific doctor on a specific day of week
     * @param doctorId The doctor's ID
     * @param dayOfWeek Day of week (1-7, where 1=Monday, 7=Sunday)
     * @return List of schedules matching the criteria
     */
    List<Schedule> findByDoctorIdAndDayOfWeek(Long doctorId, Integer dayOfWeek);

    /**
     * Find all schedules for a specific day of week across all doctors
     * @param dayOfWeek Day of week (1-7, where 1=Monday, 7=Sunday)
     * @return List of schedules for that day
     */
    List<Schedule> findByDayOfWeek(Integer dayOfWeek);

    /**
     * Find schedules for a doctor that are valid for a specific date
     * This considers the day of week and the valid_from/valid_to date range
     * 
     * @param doctorId The doctor's ID
     * @param date The date to check
     * @param dayOfWeek Day of week value (1-7)
     * @return List of valid schedules for the given date
     */
    @Query("SELECT s FROM Schedule s WHERE s.doctorId = :doctorId " +
           "AND s.dayOfWeek = :dayOfWeek " +
           "AND (s.validFrom IS NULL OR s.validFrom <= :date) " +
           "AND (s.validTo IS NULL OR s.validTo >= :date)")
    List<Schedule> findValidSchedulesForDate(
        @Param("doctorId") Long doctorId,
        @Param("date") LocalDate date,
        @Param("dayOfWeek") Integer dayOfWeek
    );

    /**
     * Find all active schedules for a doctor that are valid for a specific date
     * Convenience method that automatically extracts day of week from the date
     * 
     * @param doctorId The doctor's ID
     * @param date The date to check
     * @return List of valid schedules for the given date
     */
    default List<Schedule> findValidSchedulesForDate(Long doctorId, LocalDate date) {
        return findValidSchedulesForDate(doctorId, date, date.getDayOfWeek().getValue());
    }

    /**
     * Find schedules by doctor ID and validity date range
     * Useful for checking schedule conflicts
     * 
     * @param doctorId The doctor's ID
     * @param startDate Start of the date range
     * @param endDate End of the date range
     * @return List of schedules that overlap with the date range
     */
    @Query("SELECT s FROM Schedule s WHERE s.doctorId = :doctorId " +
           "AND (s.validTo IS NULL OR s.validTo >= :startDate) " +
           "AND (s.validFrom IS NULL OR s.validFrom <= :endDate)")
    List<Schedule> findSchedulesInDateRange(
        @Param("doctorId") Long doctorId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Find all currently active schedules (valid today)
     * @param today Today's date
     * @return List of active schedules
     */
    @Query("SELECT s FROM Schedule s WHERE " +
           "(s.validFrom IS NULL OR s.validFrom <= :today) " +
           "AND (s.validTo IS NULL OR s.validTo >= :today)")
    List<Schedule> findActiveSchedules(@Param("today") LocalDate today);

    /**
     * Check if a doctor has any schedules for a specific day of week
     * @param doctorId The doctor's ID
     * @param dayOfWeek Day of week (1-7)
     * @return true if schedules exist
     */
    boolean existsByDoctorIdAndDayOfWeek(Long doctorId, Integer dayOfWeek);

    /**
     * Delete all schedules for a specific doctor
     * Useful when removing a doctor from the system
     * @param doctorId The doctor's ID
     */
    void deleteByDoctorId(Long doctorId);
}

