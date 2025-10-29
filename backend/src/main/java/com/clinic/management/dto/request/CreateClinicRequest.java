package com.clinic.management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

/**
 * DTO for creating a new clinic
 * 
 * Validation requirements:
 * - name: required, max 255 characters
 * - addressLine: required
 * - All other fields are optional
 */
public class CreateClinicRequest {
    
    @NotBlank(message = "Clinic name is required")
    @Size(max = 255, message = "Clinic name must not exceed 255 characters")
    private String name;
    
    @NotBlank(message = "Address is required")
    private String addressLine;
    
    private String area;
    
    private String region;
    
    private String clinicType;
    
    private LocalTime openTime;
    
    private LocalTime closeTime;
    
    private String note;
    
    private String remarks;
    
    // Constructors
    public CreateClinicRequest() {
    }
    
    public CreateClinicRequest(String name, String addressLine, String area, String region) {
        this.name = name;
        this.addressLine = addressLine;
        this.area = area;
        this.region = region;
    }
    
    // Getters and Setters
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
    
    @Override
    public String toString() {
        return "CreateClinicRequest{" +
                "name='" + name + '\'' +
                ", addressLine='" + addressLine + '\'' +
                ", area='" + area + '\'' +
                ", region='" + region + '\'' +
                ", clinicType='" + clinicType + '\'' +
                '}';
    }
}

