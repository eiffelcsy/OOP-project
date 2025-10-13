package com.clinic.management.dto.response;

import com.clinic.management.model.Clinic;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO for clinic response
 * Represents a clinic entity in API responses
 */
public class ClinicResponse {
    
    private Long id;
    private String name;
    private String addressLine;
    private String area;
    private String region;
    private String clinicType;
    private LocalTime openTime;
    private LocalTime closeTime;
    private String note;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public ClinicResponse() {
    }
    
    /**
     * Create ClinicResponse from Clinic entity
     * @param clinic Clinic entity
     * @return ClinicResponse DTO
     */
    public static ClinicResponse from(Clinic clinic) {
        ClinicResponse response = new ClinicResponse();
        response.setId(clinic.getId());
        response.setName(clinic.getName());
        response.setAddressLine(clinic.getAddressLine());
        response.setArea(clinic.getArea());
        response.setRegion(clinic.getRegion());
        response.setClinicType(clinic.getClinicType());
        response.setOpenTime(clinic.getOpenTime());
        response.setCloseTime(clinic.getCloseTime());
        response.setNote(clinic.getNote());
        response.setRemarks(clinic.getRemarks());
        response.setCreatedAt(clinic.getCreatedAt());
        response.setUpdatedAt(clinic.getUpdatedAt());
        // Note: sourceRef excluded (internal field)
        return response;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getAddressLine() {
        return addressLine;
    }
    
    public void setAddressLine(String addressLine) {
        this.addressLine = addressLine;
    }
    
    public String getArea() {
        return area;
    }
    
    public void setArea(String area) {
        this.area = area;
    }
    
    public String getRegion() {
        return region;
    }
    
    public void setRegion(String region) {
        this.region = region;
    }
    
    public String getClinicType() {
        return clinicType;
    }
    
    public void setClinicType(String clinicType) {
        this.clinicType = clinicType;
    }
    
    public LocalTime getOpenTime() {
        return openTime;
    }
    
    public void setOpenTime(LocalTime openTime) {
        this.openTime = openTime;
    }
    
    public LocalTime getCloseTime() {
        return closeTime;
    }
    
    public void setCloseTime(LocalTime closeTime) {
        this.closeTime = closeTime;
    }
    
    public String getNote() {
        return note;
    }
    
    public void setNote(String note) {
        this.note = note;
    }
    
    public String getRemarks() {
        return remarks;
    }
    
    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @Override
    public String toString() {
        return "ClinicResponse{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", area='" + area + '\'' +
                ", region='" + region + '\'' +
                ", clinicType='" + clinicType + '\'' +
                '}';
    }
}

