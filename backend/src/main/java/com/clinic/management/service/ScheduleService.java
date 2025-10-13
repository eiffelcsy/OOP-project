package com.clinic.management.service;

import com.clinic.management.model.Schedule;
import com.clinic.management.repository.ScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for managing doctor schedules.
 * Provides methods for CRUD operations and slot generation.
 */
@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;

    public ScheduleService(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    /**
     * Get all schedules
     * @return List of all schedules
     */
    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }

    /**
     * Get schedule by ID
     * @param id Schedule ID
     * @return Schedule entity
     */
    public Schedule getScheduleById(Long id) {
        return scheduleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Schedule not found with id: " + id));
    }

    /**
     * Get all schedules for a specific doctor
     * @param doctorId Doctor ID
     * @return List of schedules for the doctor
     */
    public List<Schedule> getSchedulesByDoctorId(Long doctorId) {
        return scheduleRepository.findByDoctorId(doctorId);
    }

    /**
     * Get schedules for a doctor on a specific day of week
     * @param doctorId Doctor ID
     * @param dayOfWeek Day of week (1-7, where 1=Monday, 7=Sunday)
     * @return List of schedules
     */
    public List<Schedule> getSchedulesByDoctorAndDay(Long doctorId, Integer dayOfWeek) {
        return scheduleRepository.findByDoctorIdAndDayOfWeek(doctorId, dayOfWeek);
    }

    /**
     * Get valid schedules for a doctor on a specific date
     * This considers both the day of week and the valid_from/valid_to range
     * 
     * @param doctorId Doctor ID
     * @param date The date to check
     * @return List of valid schedules
     */
    public List<Schedule> getValidSchedulesForDate(Long doctorId, LocalDate date) {
        return scheduleRepository.findValidSchedulesForDate(doctorId, date);
    }

    /**
     * Get all currently active schedules
     * @return List of active schedules
     */
    public List<Schedule> getActiveSchedules() {
        return scheduleRepository.findActiveSchedules(LocalDate.now());
    }

    /**
     * Create a new schedule
     * @param schedule Schedule entity to create
     * @return Created schedule
     */
    @Transactional
    public Schedule createSchedule(Schedule schedule) {
        // Validate schedule
        validateSchedule(schedule);
        
        // Set timestamps
        java.time.OffsetDateTime now = java.time.OffsetDateTime.now();
        schedule.setCreatedAt(now);
        schedule.setUpdatedAt(now);
        
        return scheduleRepository.save(schedule);
    }

    /**
     * Update an existing schedule
     * @param id Schedule ID
     * @param updatedSchedule Updated schedule data
     * @return Updated schedule
     */
    @Transactional
    public Schedule updateSchedule(Long id, Schedule updatedSchedule) {
        Schedule existingSchedule = getScheduleById(id);
        
        // Validate updated schedule
        validateSchedule(updatedSchedule);
        
        // Update fields
        existingSchedule.setDoctorId(updatedSchedule.getDoctorId());
        existingSchedule.setDayOfWeek(updatedSchedule.getDayOfWeek());
        existingSchedule.setStartTime(updatedSchedule.getStartTime());
        existingSchedule.setEndTime(updatedSchedule.getEndTime());
        existingSchedule.setSlotDurationMinutes(updatedSchedule.getSlotDurationMinutes());
        existingSchedule.setValidFrom(updatedSchedule.getValidFrom());
        existingSchedule.setValidTo(updatedSchedule.getValidTo());
        existingSchedule.setUpdatedAt(java.time.OffsetDateTime.now());
        
        return scheduleRepository.save(existingSchedule);
    }

    /**
     * Delete a schedule
     * @param id Schedule ID
     */
    @Transactional
    public void deleteSchedule(Long id) {
        Schedule schedule = getScheduleById(id);
        scheduleRepository.delete(schedule);
    }

    /**
     * Delete all schedules for a doctor
     * @param doctorId Doctor ID
     */
    @Transactional
    public void deleteSchedulesByDoctorId(Long doctorId) {
        scheduleRepository.deleteByDoctorId(doctorId);
    }

    /**
     * Generate time slot DTOs from a schedule for a specific date
     * This is useful for on-demand slot generation
     * 
     * @param schedule The schedule to generate slots from
     * @param date The date for which to generate slots
     * @return List of time slot start/end times
     */
    public List<TimeSlotDTO> generateSlotsFromSchedule(Schedule schedule, LocalDate date) {
        List<TimeSlotDTO> slots = new ArrayList<>();
        
        // Validate that schedule applies to this date
        if (!schedule.appliesToDate(date) || !schedule.isValidForDate(date)) {
            return slots;
        }
        
        LocalTime current = schedule.getStartTime();
        LocalTime end = schedule.getEndTime();
        int duration = schedule.getSlotDurationMinutes();
        
        // Generate slots
        while (current.plusMinutes(duration).isBefore(end) || 
               current.plusMinutes(duration).equals(end)) {
            slots.add(new TimeSlotDTO(
                LocalDateTime.of(date, current),
                LocalDateTime.of(date, current.plusMinutes(duration)),
                schedule.getDoctorId()
            ));
            current = current.plusMinutes(duration);
        }
        
        return slots;
    }

    /**
     * Generate all possible time slots for a doctor on a specific date
     * Combines slots from all valid schedules for that date
     * 
     * @param doctorId Doctor ID
     * @param date The date for which to generate slots
     * @return List of all possible time slots
     */
    public List<TimeSlotDTO> generateAllSlotsForDate(Long doctorId, LocalDate date) {
        List<Schedule> validSchedules = getValidSchedulesForDate(doctorId, date);
        List<TimeSlotDTO> allSlots = new ArrayList<>();
        
        for (Schedule schedule : validSchedules) {
            allSlots.addAll(generateSlotsFromSchedule(schedule, date));
        }
        
        return allSlots;
    }

    /**
     * Validate schedule data
     * @param schedule Schedule to validate
     * @throws IllegalArgumentException if validation fails
     */
    private void validateSchedule(Schedule schedule) {
        if (schedule.getDoctorId() == null) {
            throw new IllegalArgumentException("Doctor ID is required");
        }
        
        if (schedule.getDayOfWeek() == null || schedule.getDayOfWeek() < 1 || schedule.getDayOfWeek() > 7) {
            throw new IllegalArgumentException("Day of week must be between 1 (Monday) and 7 (Sunday)");
        }
        
        if (schedule.getStartTime() == null) {
            throw new IllegalArgumentException("Start time is required");
        }
        
        if (schedule.getEndTime() == null) {
            throw new IllegalArgumentException("End time is required");
        }
        
        if (schedule.getStartTime().isAfter(schedule.getEndTime()) || 
            schedule.getStartTime().equals(schedule.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
        
        if (schedule.getSlotDurationMinutes() == null || schedule.getSlotDurationMinutes() <= 0) {
            throw new IllegalArgumentException("Slot duration must be greater than 0");
        }
        
        // Validate that at least one slot can be generated
        long totalMinutes = java.time.Duration.between(schedule.getStartTime(), schedule.getEndTime()).toMinutes();
        if (totalMinutes < schedule.getSlotDurationMinutes()) {
            throw new IllegalArgumentException("Schedule duration is too short for the specified slot duration");
        }
        
        // Validate date range if both are provided
        if (schedule.getValidFrom() != null && schedule.getValidTo() != null) {
            if (schedule.getValidFrom().isAfter(schedule.getValidTo())) {
                throw new IllegalArgumentException("Valid from date must be before or equal to valid to date");
            }
        }
    }

    /**
     * DTO for representing a time slot
     * Used for on-demand slot generation
     */
    public static class TimeSlotDTO {
        private LocalDateTime slotStart;
        private LocalDateTime slotEnd;
        private Long doctorId;

        public TimeSlotDTO(LocalDateTime slotStart, LocalDateTime slotEnd, Long doctorId) {
            this.slotStart = slotStart;
            this.slotEnd = slotEnd;
            this.doctorId = doctorId;
        }

        public LocalDateTime getSlotStart() {
            return slotStart;
        }

        public void setSlotStart(LocalDateTime slotStart) {
            this.slotStart = slotStart;
        }

        public LocalDateTime getSlotEnd() {
            return slotEnd;
        }

        public void setSlotEnd(LocalDateTime slotEnd) {
            this.slotEnd = slotEnd;
        }

        public Long getDoctorId() {
            return doctorId;
        }

        public void setDoctorId(Long doctorId) {
            this.doctorId = doctorId;
        }
    }
}

