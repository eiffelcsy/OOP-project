package com.clinic.management.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO for updating an existing schedule
 * 
 * All fields are optional - only provided fields will be updated
 * 
 * Validation requirements:
 * - dayOfWeek: if provided, must be between 1 (Monday) and 7 (Sunday)
 * - slotDurationMinutes: if provided, must be positive
 */
public class UpdateScheduleRequest {
    
    @JsonProperty("doctorId")
    private Long doctorId;
    
    @JsonProperty("dayOfWeek")
    @Min(value = 1, message = "Day of week must be between 1 (Monday) and 7 (Sunday)")
    @Max(value = 7, message = "Day of week must be between 1 (Monday) and 7 (Sunday)")
    private Integer dayOfWeek;
    
    @JsonProperty("startTime")
    private LocalTime startTime;
    
    @JsonProperty("endTime")
    private LocalTime endTime;
    
    @JsonProperty("slotDurationMinutes")
    @Min(value = 1, message = "Slot duration must be at least 1 minute")
    private Integer slotDurationMinutes;
    
    @JsonProperty("validFrom")
    private LocalDate validFrom;
    
    @JsonProperty("validTo")
    private LocalDate validTo;
    
    // Constructors
    public UpdateScheduleRequest() {
    }
    
    public UpdateScheduleRequest(Long doctorId, Integer dayOfWeek, LocalTime startTime, 
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
        return "UpdateScheduleRequest{" +
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

