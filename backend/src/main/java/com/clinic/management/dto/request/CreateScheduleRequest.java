package com.clinic.management.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO for creating a new schedule
 * 
 * Validation requirements:
 * - doctorId: required
 * - dayOfWeek: required, must be between 1 (Monday) and 7 (Sunday)
 * - startTime: required
 * - endTime: required
 * - slotDurationMinutes: required, must be positive
 * - validFrom: optional
 * - validTo: optional
 */
public class CreateScheduleRequest {
    
    @JsonProperty("doctorId")
    @NotNull(message = "Doctor ID is required")
    private Long doctorId;
    
    @JsonProperty("dayOfWeek")
    @NotNull(message = "Day of week is required")
    @Min(value = 1, message = "Day of week must be between 1 (Monday) and 7 (Sunday)")
    @Max(value = 7, message = "Day of week must be between 1 (Monday) and 7 (Sunday)")
    private Integer dayOfWeek;
    
    @JsonProperty("startTime")
    @NotNull(message = "Start time is required")
    private LocalTime startTime;
    
    @JsonProperty("endTime")
    @NotNull(message = "End time is required")
    private LocalTime endTime;
    
    @JsonProperty("slotDurationMinutes")
    @NotNull(message = "Slot duration is required")
    @Min(value = 1, message = "Slot duration must be at least 1 minute")
    private Integer slotDurationMinutes;
    
    @JsonProperty("validFrom")
    private LocalDate validFrom;
    
    @JsonProperty("validTo")
    private LocalDate validTo;
    
    // Constructors
    public CreateScheduleRequest() {
    }
    
    public CreateScheduleRequest(Long doctorId, Integer dayOfWeek, LocalTime startTime, 
                                LocalTime endTime, Integer slotDurationMinutes, 
                                LocalDate validFrom, LocalDate validTo) {
        this.doctorId = doctorId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.slotDurationMinutes = slotDurationMinutes;
        this.validFrom = validFrom;
        this.validTo = validTo;
    }
    
    // Getters and Setters
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
    
    @Override
    public String toString() {
        return "CreateScheduleRequest{" +
                "doctorId=" + doctorId +
                ", dayOfWeek=" + dayOfWeek +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", slotDurationMinutes=" + slotDurationMinutes +
                ", validFrom=" + validFrom +
                ", validTo=" + validTo +
                '}';
    }
}

