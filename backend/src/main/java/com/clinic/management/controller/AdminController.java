package com.clinic.management.controller;

import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.clinic.management.dto.request.CreateClinicRequest;
import com.clinic.management.dto.request.CreateDoctorRequest;
import com.clinic.management.dto.request.CreateScheduleRequest;
import com.clinic.management.dto.request.CreateUserRequest;
import com.clinic.management.dto.request.UpdateDoctorRequest;
import com.clinic.management.dto.request.UpdateScheduleRequest;
import com.clinic.management.dto.request.UpdateUserRequest;
import com.clinic.management.dto.request.UpdateClinicRequest;

import com.clinic.management.dto.response.DoctorResponse;
import com.clinic.management.dto.response.ScheduleResponse;
import com.clinic.management.dto.response.UserResponse;
import com.clinic.management.dto.response.ClinicResponse;

import com.clinic.management.model.Clinic;
import com.clinic.management.model.Doctor;
import com.clinic.management.model.Schedule;

import com.clinic.management.service.AdminStatisticsService;
import com.clinic.management.service.ClinicService;
import com.clinic.management.service.DoctorService;
import com.clinic.management.service.ScheduleService;
import com.clinic.management.service.UserService;

/**
 * REST Controller for Admin clinic management operations
 * Provides endpoints for CRUD operations on clinics, users
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*") // Configure appropriately for production
@Validated
public class AdminController {

    private final ClinicService clinicService;
    private final UserService userService;
    private final DoctorService doctorService;
    private final ScheduleService scheduleService;
    private final AdminStatisticsService statisticsService;
    
    @Autowired
    public AdminController(ClinicService clinicService, UserService userService, DoctorService doctorService, ScheduleService scheduleService, AdminStatisticsService statisticsService) {
        this.clinicService = clinicService;
        this.userService = userService;
        this.doctorService = doctorService;
        this.scheduleService = scheduleService;
        this.statisticsService = statisticsService;
    }
    
    // ================================ STATISTICS ENDPOINTS ================================
    
    /**
     * GET /api/admin/statistics
     * Fetch system-wide statistics for admin dashboard
     * @return System statistics including metrics, status, and usage
     */
    @Tag(name = "Admin - Statistics", description = "System statistics and analytics")
    @Operation(summary = "Get system statistics", description = "Fetch system-wide statistics for admin dashboard")
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getSystemStatistics() {
        Map<String, Object> statistics = statisticsService.getSystemStatistics();
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * GET /api/admin/statistics/registrations
     * Fetch new registrations count
     * @param hours Number of hours to look back (default 24)
     * @return Count of new registrations
     */
    @Tag(name = "Admin - Statistics")
    @Operation(summary = "Get new registrations", description = "Fetch count of new registrations within specified hours")
    @GetMapping("/statistics/registrations")
    public ResponseEntity<Map<String, Object>> getNewRegistrations(@RequestParam(defaultValue = "24") int hours) {
        long count = statisticsService.getNewRegistrations(hours);
        Map<String, Object> response = Map.of(
            "count", count,
            "hours", hours
        );
        return ResponseEntity.ok(response);
    }
    
    // ================================ CLINIC MANAGEMENT ENDPOINTS ================================
    
    /**
     * GET /api/admin/clinics
     * Fetch all clinics
     * @return List of all clinics as ClinicResponse DTOs
     */
    @Tag(name = "Admin - Clinics", description = "Clinic management endpoints")
    @Operation(summary = "Get all clinics", description = "Retrieve a list of all clinics")
    @GetMapping("/clinics")
    public ResponseEntity<List<ClinicResponse>> getAllClinics() {
        List<Clinic> clinics = clinicService.getAllClinics();
        List<ClinicResponse> responses = clinics.stream()
            .map(ClinicResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    /**
     * GET /api/admin/clinics/{id}
     * Fetch single clinic by ID
     * @param id Clinic ID
     * @return Clinic data or 404 if not found
     */
    @Tag(name = "Admin - Clinics")
    @Operation(summary = "Get clinic by ID", description = "Retrieve a clinic by its ID")
    @GetMapping("/clinics/{id}")
    public ResponseEntity<ClinicResponse> getClinicById(@PathVariable Long id) {
        return clinicService.getClinicById(id)
            .map(clinic -> ResponseEntity.ok(ClinicResponse.from(clinic)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * POST /api/admin/clinics
     * Create a new clinic
     * @param request Create clinic request (validated)
     * @return Created clinic with 201 status
     */
    @Tag(name = "Admin - Clinics")
    @Operation(summary = "Create clinic", description = "Create a new clinic")
    @PostMapping("/clinics")
    public ResponseEntity<ClinicResponse> createClinic(@Valid @RequestBody CreateClinicRequest request) {
        Clinic createdClinic = clinicService.createClinic(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ClinicResponse.from(createdClinic));
    }
    
    /**
     * PUT /api/admin/clinics/{id}
     * Update an existing clinic
     * @param id Clinic ID
     * @param request Update clinic request (validated, all fields optional)
     * @return Updated clinic or error response
     */
    @Tag(name = "Admin - Clinics")
    @Operation(summary = "Update clinic", description = "Update an existing clinic")
    @PutMapping("/clinics/{id}")
    public ResponseEntity<ClinicResponse> updateClinic(
        @PathVariable Long id,
        @Valid @RequestBody UpdateClinicRequest request
    ) {
        Clinic updatedClinic = clinicService.updateClinic(id, request);
        return ResponseEntity.ok(ClinicResponse.from(updatedClinic));
    }
    
    /**
     * DELETE /api/admin/clinics/{id}
     * Delete a clinic
     * @param id Clinic ID
     * @return 204 No Content on success
     */
    @Tag(name = "Admin - Clinics")
    @Operation(summary = "Delete clinic", description = "Delete a clinic by ID")
    @DeleteMapping("/clinics/{id}")
    public ResponseEntity<Void> deleteClinic(@PathVariable Long id) {
        clinicService.deleteClinic(id);
        return ResponseEntity.noContent().build();
    }

    // ================================ USER MANAGEMENT ENDPOINTS ================================

    /**
     * GET /api/admin/users
     * Fetch all users
     * @return List of all users as UserResponse DTOs
     */
    @Tag(name = "Admin - Users", description = "User management endpoints")
    @Operation(summary = "Get all users", description = "Retrieve a list of all users")
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/admin/users/{id}
     * Fetch single user by ID
     * @param id User ID
     * @return User data or 404 if not found
     */
    @Tag(name = "Admin - Users")
    @Operation(summary = "Get user by ID", description = "Retrieve a user by their ID")
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/admin/users
     * Create a new user
     * @param request Create user request (validated)
     * @return Created user with 201 status
     */
    @Tag(name = "Admin - Users")
    @Operation(summary = "Create user", description = "Create a new user")
    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    /**
     * PUT /api/admin/users/{id}
     * Update an existing user
     * @param id User ID
     * @param request Update user request (validated, all fields optional)
     * @return Updated user or error response
     */
    @Tag(name = "Admin - Users")
    @Operation(summary = "Update user", description = "Update an existing user")
    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        UserResponse user = userService.updateUser(id, request);
        return ResponseEntity.ok(user);
    }

    /**
     * DELETE /api/admin/users/{id}
     * Delete a user
     * @param id User ID
     * @return 204 No Content on success
     */
    @Tag(name = "Admin - Users")
    @Operation(summary = "Delete user", description = "Delete a user by ID")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ================================ DOCTOR MANAGEMENT ENDPOINTS ================================

    /**
     * GET /api/admin/doctors
     * Fetch all doctors
     * @return List of all doctors as DoctorResponse DTOs
     */
    @Tag(name = "Admin - Doctors", description = "Doctor management endpoints")
    @Operation(summary = "Get all doctors", description = "Retrieve a list of all doctors")
    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponse>> getAllDoctors() {
        List<Doctor> doctors = doctorService.getAllDoctors();
        List<DoctorResponse> responses = doctors.stream()
            .map(DoctorResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/admin/doctors/clinic/{clinicId}
     * Fetch all doctors by clinicId
     * @param clinicId Clinic ID
     * @return List of all doctors by clinicId as DoctorResponse DTOs
     */
    @Tag(name = "Admin - Doctors")
    @Operation(summary = "Get doctors by clinic", description = "Retrieve all doctors for a specific clinic")
    @GetMapping("/doctors/clinic/{clinicId}")
    public ResponseEntity<List<DoctorResponse>> getDoctorsByClinicId(@PathVariable Long clinicId) {
        List<Doctor> doctors = doctorService.getDoctorsByClinicId(clinicId);
        List<DoctorResponse> responses = doctors.stream()
            .map(DoctorResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/admin/doctors/{id}
     * Fetch a single doctor by ID
     * @param id Doctor ID
     * @return Doctor as DoctorResponse DTO
     */
    @Tag(name = "Admin - Doctors")
    @Operation(summary = "Get doctor by ID", description = "Retrieve a doctor by their ID")
    @GetMapping("/doctors/{id}")
    public ResponseEntity<DoctorResponse> getDoctorById(@PathVariable Long id) {
        Doctor doctor = doctorService.getDoctorById(id);
        return ResponseEntity.ok(DoctorResponse.from(doctor));
    }

    /**
     * POST /api/admin/doctors
     * Create a new doctor
     * @param request Create doctor request (validated)
     * @return Created doctor with 201 status
     */
    @Tag(name = "Admin - Doctors")
    @Operation(summary = "Create doctor", description = "Create a new doctor")
    @PostMapping("/doctors")
    public ResponseEntity<DoctorResponse> createDoctor(@Valid @RequestBody CreateDoctorRequest request) {
        Doctor createdDoctor = doctorService.createDoctor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(DoctorResponse.from(createdDoctor));
    }

    /**
     * PUT /api/admin/doctors/{id}
     * Update an existing doctor
     * @param id Doctor ID
     * @param request Update doctor request (validated, all fields optional)
     * @return Updated doctor or error response
     */
    @Tag(name = "Admin - Doctors")
    @Operation(summary = "Update doctor", description = "Update an existing doctor")
    @PutMapping("/doctors/{id}")
    public ResponseEntity<DoctorResponse> updateDoctor(@PathVariable Long id, @Valid @RequestBody UpdateDoctorRequest request) {
        Doctor updatedDoctor = doctorService.updateDoctor(id, request);
        return ResponseEntity.ok(DoctorResponse.from(updatedDoctor));
    }

    /**
     * DELETE /api/admin/doctors/{id}
     * Delete a doctor
     * @param id Doctor ID
     * @return 204 No Content on success
     */
    @Tag(name = "Admin - Doctors")
    @Operation(summary = "Delete doctor", description = "Delete a doctor by ID")
    @DeleteMapping("/doctors/{id}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.noContent().build();
    }

    // ================================ DOCTOR SCHEDULES MANAGEMENT ENDPOINTS ================================

    /**
     * GET /api/admin/doctors/{doctorId}/schedules
     * Fetch all schedules for a specific doctor
     * @param doctorId Doctor ID
     * @return List of all schedules for the doctor as ScheduleResponse DTOs
     */
    @Tag(name = "Admin - Schedules", description = "Doctor schedule management endpoints")
    @Operation(summary = "Get schedules by doctor", description = "Retrieve all schedules for a specific doctor")
    @GetMapping("/doctors/{doctorId}/schedules")
    public ResponseEntity<List<ScheduleResponse>> getSchedulesByDoctorId(@PathVariable Long doctorId) {
        List<Schedule> schedules = scheduleService.getSchedulesByDoctorId(doctorId);
        List<ScheduleResponse> responses = schedules.stream()
            .map(ScheduleResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    /**
     * POST /api/admin/schedules
     * Create a new schedule
     * @param request Create schedule request (validated)
     * @return Created schedule with 201 status
     */
    @Tag(name = "Admin - Schedules")
    @Operation(summary = "Create schedule", description = "Create a new doctor schedule")
    @PostMapping("/schedules")
    public ResponseEntity<ScheduleResponse> createSchedule(@Valid @RequestBody CreateScheduleRequest request) {
        Schedule schedule = new Schedule();
        schedule.setDoctorId(request.getDoctorId());
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setSlotDurationMinutes(request.getSlotDurationMinutes());
        schedule.setValidFrom(request.getValidFrom());
        schedule.setValidTo(request.getValidTo());
        
        Schedule createdSchedule = scheduleService.createSchedule(schedule);
        return ResponseEntity.status(HttpStatus.CREATED).body(ScheduleResponse.from(createdSchedule));
    }
    
    /**
     * PUT /api/admin/schedules/{id}
     * Update an existing schedule
     * @param id Schedule ID
     * @param request Update schedule request (validated, all fields optional)
     * @return Updated schedule or error response
     */
    @Tag(name = "Admin - Schedules")
    @Operation(summary = "Update schedule", description = "Update an existing doctor schedule")
    @PutMapping("/schedules/{id}")
    public ResponseEntity<ScheduleResponse> updateSchedule(@PathVariable Long id, @Valid @RequestBody UpdateScheduleRequest request) {
        Schedule schedule = new Schedule();
        schedule.setDoctorId(request.getDoctorId());
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setSlotDurationMinutes(request.getSlotDurationMinutes());
        schedule.setValidFrom(request.getValidFrom());
        schedule.setValidTo(request.getValidTo());
        
        Schedule updatedSchedule = scheduleService.updateSchedule(id, schedule);
        return ResponseEntity.ok(ScheduleResponse.from(updatedSchedule));
    }
    
    /**
     * DELETE /api/admin/schedules/{id}
     * Delete a schedule
     * @param id Schedule ID
     * @return 204 No Content on success
     */
    @Tag(name = "Admin - Schedules")
    @Operation(summary = "Delete schedule", description = "Delete a doctor schedule by ID")
    @DeleteMapping("/schedules/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }
    
}
