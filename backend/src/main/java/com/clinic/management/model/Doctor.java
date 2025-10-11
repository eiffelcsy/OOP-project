package com.clinic.management.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @Column(name = "clinic_id")
    private Long clinicId;

    @Column(nullable = false)
    private String name;

    private String specialty;
    private Boolean active;

    @Column(name = "created_at", columnDefinition = "timestamptz")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "timestamptz")
    private OffsetDateTime updatedAt;

    public Doctor() {}

    public Doctor(Long clinicId, String name, String specialty, Boolean active,
                  OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.clinicId = clinicId;
        this.name = name;
        this.specialty = specialty;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getClinicId() {
        return clinicId;
    }

    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
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
}
