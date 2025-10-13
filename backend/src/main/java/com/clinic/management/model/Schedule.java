package com.clinic.management.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Objects;

/**
 * Entity representing a doctor's recurring weekly schedule.
 * Defines when a doctor is available on specific days of the week.
 */
@Entity
@Table(name = "schedules")
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    /**
     * Day of the week (1-7, where 1=Monday, 7=Sunday)
     * Following ISO-8601 standard
     */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @Column(name = "start_time", nullable = false, columnDefinition = "time")
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false, columnDefinition = "time")
    private LocalTime endTime;

    /**
     * Duration of each appointment slot in minutes
     */
    @Column(name = "slot_duration_minutes", nullable = false)
    private Integer slotDurationMinutes;

    /**
     * Date from which this schedule is valid (inclusive)
     * Null means valid from the beginning of time
     */
    @Column(name = "valid_from")
    private LocalDate validFrom;

    /**
     * Date until which this schedule is valid (inclusive)
     * Null means valid indefinitely
     */
    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "created_at", columnDefinition = "timestamptz")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "timestamptz")
    private OffsetDateTime updatedAt;

    // Constructors
    public Schedule() {}

    public Schedule(Long doctorId, Integer dayOfWeek, LocalTime startTime, LocalTime endTime, 
                   Integer slotDurationMinutes, LocalDate validFrom, LocalDate validTo) {
        this.doctorId = doctorId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.slotDurationMinutes = slotDurationMinutes;
        this.validFrom = validFrom;
        this.validTo = validTo;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public Integer getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(Integer dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public Integer getSlotDurationMinutes() {
        return slotDurationMinutes;
    }

    public void setSlotDurationMinutes(Integer slotDurationMinutes) {
        this.slotDurationMinutes = slotDurationMinutes;
    }

    public LocalDate getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDate validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDate getValidTo() {
        return validTo;
    }

    public void setValidTo(LocalDate validTo) {
        this.validTo = validTo;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Utility methods
    
    /**
     * Check if this schedule is valid for a given date
     * @param date The date to check
     * @return true if the schedule is valid for the given date
     */
    public boolean isValidForDate(LocalDate date) {
        if (validFrom != null && date.isBefore(validFrom)) {
            return false;
        }
        if (validTo != null && date.isAfter(validTo)) {
            return false;
        }
        return true;
    }

    /**
     * Check if this schedule applies to a given day of week
     * @param date The date to check
     * @return true if the schedule applies to the day of week of the given date
     */
    public boolean appliesToDate(LocalDate date) {
        return date.getDayOfWeek().getValue() == this.dayOfWeek;
    }

    /**
     * Calculate the number of slots that can be generated from this schedule
     * @return The number of appointment slots
     */
    public int calculateNumberOfSlots() {
        if (startTime == null || endTime == null || slotDurationMinutes == null || slotDurationMinutes <= 0) {
            return 0;
        }
        
        long totalMinutes = java.time.Duration.between(startTime, endTime).toMinutes();
        return (int) (totalMinutes / slotDurationMinutes);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Schedule)) return false;
        Schedule schedule = (Schedule) o;
        return Objects.equals(id, schedule.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Schedule{" +
                "id=" + id +
                ", doctorId=" + doctorId +
                ", dayOfWeek=" + dayOfWeek +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", slotDurationMinutes=" + slotDurationMinutes +
                ", validFrom=" + validFrom +
                ", validTo=" + validTo +
                '}';
    }
}

