package com.clinic.management.repository;

import com.clinic.management.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctorId(Long doctorId);
    List<Appointment> findByClinicId(Long clinicId);
    List<Appointment> findByStatus(String status);
}
