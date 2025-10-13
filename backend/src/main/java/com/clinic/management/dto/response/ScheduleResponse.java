package com.clinic.management.dto.response;

import com.clinic.management.model.Schedule;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

/**
 * DTO for schedule response
 * Maps Schedule entity to API response format
 */
public class ScheduleResponse {
    
    @JsonProperty("id")
    private Long id;
    
    @JsonProperty("doctorId")
    private Long doctorId;
    
    @JsonProperty("dayOfWeek")
    private Integer dayOfWeek;
    
    @JsonProperty("startTime")
    private LocalTime startTime;
    
    @JsonProperty("endTime")
    private LocalTime endTime;
    
    @JsonProperty("slotDurationMinutes")
    private Integer slotDurationMinutes;
    
    @JsonProperty("validFrom")
    private LocalDate validFrom;
    
    @JsonProperty("validTo")
    private LocalDate validTo;
    
    @JsonProperty("createdAt")
    private OffsetDateTime createdAt;
    
    @JsonProperty("updatedAt")
    private OffsetDateTime updatedAt;
    
    // Constructors
    public ScheduleResponse() {
    }
    
    public ScheduleResponse(Long id, Long doctorId, Integer dayOfWeek, LocalTime startTime, 
                           LocalTime endTime, Integer slotDurationMinutes, LocalDate validFrom, 
                           LocalDate validTo, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.doctorId = doctorId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.slotDurationMinutes = slotDurationMinutes;
        this.validFrom = validFrom;
        this.validTo = validTo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    /**
     * Create ScheduleResponse from Schedule entity
     * @param schedule Schedule entity
     * @return ScheduleResponse DTO
     */
    public static ScheduleResponse from(Schedule schedule) {
        return new ScheduleResponse(
            schedule.getId(),
            schedule.getDoctorId(),
            schedule.getDayOfWeek(),
            schedule.getStartTime(),
            schedule.getEndTime(),
            schedule.getSlotDurationMinutes(),
            schedule.getValidFrom(),
            schedule.getValidTo(),
            schedule.getCreatedAt(),
            schedule.getUpdatedAt()
        );
    }
    
    // Getters and Setters
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
    
    @Override
    public String toString() {
        return "ScheduleResponse{" +
                "id=" + id +
                ", doctorId=" + doctorId +
                ", dayOfWeek=" + dayOfWeek +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", slotDurationMinutes=" + slotDurationMinutes +
                ", validFrom=" + validFrom +
                ", validTo=" + validTo +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}

