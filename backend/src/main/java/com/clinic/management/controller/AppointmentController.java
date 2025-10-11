package com.clinic.management.controller;

import com.clinic.management.model.Appointment;
import com.clinic.management.service.AppointmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AppointmentController {

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) {
        this.service = service;
    }

    // # ViewAppointments
    @GetMapping("/staff/appointments")
    public List<Appointment> getAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long clinicId,
            @RequestParam(required = false) String status
    ) {
        return service.getAppointments(doctorId, clinicId, status);
    }

    // # ScheduleWalkIn
    @PostMapping
    public Appointment addAppointment(@RequestBody Appointment appointment) {
        return service.addAppointment(appointment);
    }

    // # ManagementAppointments - Reschedule
    @PutMapping("/{id}")
    public Appointment rescheduleAppointment(
            @PathVariable Long id,
            @RequestParam Long newTimeSlotId
    ) {
        return service.rescheduleAppointment(id, newTimeSlotId);
    }

    // # ManagementAppointments - Cancel
    @DeleteMapping("/{id}")
    public void cancelAppointment(@PathVariable Long id) {
        service.cancelAppointment(id);
    }
}
