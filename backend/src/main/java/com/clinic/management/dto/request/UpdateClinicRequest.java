package com.clinic.management.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

/**
 * DTO for updating an existing clinic
 * 
 * All fields are optional - only provided fields will be updated
 * Validation requirements:
 * - name: if provided, max 255 characters
 */
public class UpdateClinicRequest {
    
    @JsonProperty("name")
    @Size(max = 255, message = "Clinic name must not exceed 255 characters")
    private String name;
    
    @JsonProperty("addressLine")
    private String addressLine;
    
    @JsonProperty("area")
    private String area;
    
    @JsonProperty("region")
    private String region;
    
    @JsonProperty("clinicType")
    private String clinicType;
    
    @JsonProperty("openTime")
    private LocalTime openTime;
    
    @JsonProperty("closeTime")
    private LocalTime closeTime;
    
    @JsonProperty("note")
    private String note;
    
    @JsonProperty("remarks")
    private String remarks;
    
    // Constructors
    public UpdateClinicRequest() {
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
        return "UpdateClinicRequest{" +
                "name='" + name + '\'' +
                ", addressLine='" + addressLine + '\'' +
                ", area='" + area + '\'' +
                ", region='" + region + '\'' +
                ", clinicType='" + clinicType + '\'' +
                '}';
    }
}

