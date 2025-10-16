package com.clinic.management.repository;

import com.clinic.management.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.OffsetDateTime;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctorId(Long doctorId);
    List<Appointment> findByClinicId(Long clinicId);
    List<Appointment> findByStatus(String status);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.status = 'scheduled' AND NOT (a.endTime <= :startTime OR a.startTime >= :endTime)")
    long countOverlapping(@Param("doctorId") Long doctorId, @Param("startTime") OffsetDateTime startTime, @Param("endTime") OffsetDateTime endTime);
}
