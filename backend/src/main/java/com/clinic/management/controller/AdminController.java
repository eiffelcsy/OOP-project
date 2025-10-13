package com.clinic.management.controller;

import com.clinic.management.dto.request.CreateClinicRequest;
import com.clinic.management.dto.request.CreateUserRequest;
import com.clinic.management.dto.request.UpdateUserRequest;
import com.clinic.management.dto.response.UserResponse;
import com.clinic.management.dto.request.UpdateClinicRequest;
import com.clinic.management.dto.response.ClinicResponse;
import com.clinic.management.model.Clinic;
import com.clinic.management.service.ClinicService;
import com.clinic.management.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

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
    
    @Autowired
    public AdminController(ClinicService clinicService, UserService userService) {
        this.clinicService = clinicService;
        this.userService = userService;
    }
    
    // ================================ CLINIC MANAGEMENT ENDPOINTS ================================
    
    /**
     * GET /api/admin/clinics
     * Fetch all clinics
     * @return List of all clinics as ClinicResponse DTOs
     */
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
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
