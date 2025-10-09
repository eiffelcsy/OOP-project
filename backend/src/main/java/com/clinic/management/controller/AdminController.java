package com.clinic.management.controller;

import com.clinic.management.model.Clinic;
import com.clinic.management.service.ClinicService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Admin clinic management operations
 * Provides endpoints for CRUD operations on clinics
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*") // Configure appropriately for production
public class AdminController {

    private final ClinicService clinicService;
    
    @Autowired
    public AdminController(ClinicService clinicService) {
        this.clinicService = clinicService;
    }
    
    /**
     * GET /api/admin/clinics
     * Fetch all clinics
     * @return List of all clinics
     */
    @GetMapping("/clinics")
    public ResponseEntity<List<Clinic>> getAllClinics() {
        try {
            List<Clinic> clinics = clinicService.getAllClinics();
            return ResponseEntity.ok(clinics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/admin/clinics/{id}
     * Fetch single clinic by ID
     * @param id Clinic ID
     * @return Clinic data or 404 if not found
     */
    @GetMapping("/clinics/{id}")
    public ResponseEntity<Clinic> getClinicById(@PathVariable Long id) {
        try {
            Optional<Clinic> clinic = clinicService.getClinicById(id);
            return clinic.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/admin/clinics
     * Create a new clinic
     * @param clinic Clinic data
     * @return Created clinic with 201 status
     */
    @PostMapping("/clinics")
    public ResponseEntity<?> createClinic(@RequestBody Clinic clinic) {
        try {
            Clinic createdClinic = clinicService.createClinic(clinic);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdClinic);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("Failed to create clinic: " + e.getMessage());
        }
    }
    
    /**
     * PUT /api/admin/clinics/{id}
     * Update an existing clinic
     * @param id Clinic ID
     * @param clinic Updated clinic data
     * @return Updated clinic or error response
     */
    @PutMapping("/clinics/{id}")
    public ResponseEntity<?> updateClinic(@PathVariable Long id, @RequestBody Clinic clinic) {
        try {
            Clinic updatedClinic = clinicService.updateClinic(id, clinic);
            return ResponseEntity.ok(updatedClinic);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("Failed to update clinic: " + e.getMessage());
        }
    }
    
    /**
     * DELETE /api/admin/clinics/{id}
     * Delete a clinic
     * @param id Clinic ID
     * @return 204 No Content on success
     */
    @DeleteMapping("/clinics/{id}")
    public ResponseEntity<?> deleteClinic(@PathVariable Long id) {
        try {
            clinicService.deleteClinic(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("Failed to delete clinic: " + e.getMessage());
        }
    }
    
    /**
     * GET /api/admin/clinics/search?name={name}
     * Search clinics by name (partial match)
     * @param name Partial clinic name
     * @return List of matching clinics
     */
    @GetMapping("/clinics/search")
    public ResponseEntity<List<Clinic>> searchClinics(@RequestParam String name) {
        try {
            List<Clinic> clinics = clinicService.searchClinicsByName(name);
            return ResponseEntity.ok(clinics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/admin/clinics/region/{region}
     * Get clinics by region
     * @param region Region name
     * @return List of clinics in the region
     */
    @GetMapping("/clinics/region/{region}")
    public ResponseEntity<List<Clinic>> getClinicsByRegion(@PathVariable String region) {
        try {
            List<Clinic> clinics = clinicService.getClinicsByRegion(region);
            return ResponseEntity.ok(clinics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/admin/clinics/area/{area}
     * Get clinics by area
     * @param area Area name
     * @return List of clinics in the area
     */
    @GetMapping("/clinics/area/{area}")
    public ResponseEntity<List<Clinic>> getClinicsByArea(@PathVariable String area) {
        try {
            List<Clinic> clinics = clinicService.getClinicsByArea(area);
            return ResponseEntity.ok(clinics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/admin/clinics/type/{type}
     * Get clinics by type
     * @param type Clinic type
     * @return List of clinics of that type
     */
    @GetMapping("/clinics/type/{type}")
    public ResponseEntity<List<Clinic>> getClinicsByType(@PathVariable String type) {
        try {
            List<Clinic> clinics = clinicService.getClinicsByType(type);
            return ResponseEntity.ok(clinics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
