package com.clinic.management.service;

import com.clinic.management.dto.request.CreateUserRequest;
import com.clinic.management.dto.request.UpdateUserRequest;
import com.clinic.management.dto.response.UserResponse;
import com.clinic.management.exception.CustomExceptions.*;
import com.clinic.management.model.*;
import com.clinic.management.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing users across Profile, Patient, Staff, and Admin entities
 * Handles creation, updating, deletion, and retrieval of unified user data
 */
@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final ProfileRepository profileRepository;
    private final PatientRepository patientRepository;
    private final StaffRepository staffRepository;
    private final AdminRepository adminRepository;
    private final ClinicRepository clinicRepository;
    private final RestTemplate restTemplate;
    
    @Value("${supabase.url}")
    private String supabaseUrl;
    
    @Value("${supabase.service.role.key}")
    private String supabaseServiceKey;
    
    @Autowired
    public UserService(
            ProfileRepository profileRepository,
            PatientRepository patientRepository,
            StaffRepository staffRepository,
            AdminRepository adminRepository,
            ClinicRepository clinicRepository,
            RestTemplate restTemplate
    ) {
        this.profileRepository = profileRepository;
        this.patientRepository = patientRepository;
        this.staffRepository = staffRepository;
        this.adminRepository = adminRepository;
        this.clinicRepository = clinicRepository;
        this.restTemplate = restTemplate;
    }
    
    /**
     * Get all users (combines all profiles with their role data)
     */
    public List<UserResponse> getAllUsers() {
        List<Profile> profiles = profileRepository.findAll();
        
        return profiles.stream()
                .map(this::buildUserResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get user by profile ID
     */
    public Optional<UserResponse> getUserById(Long profileId) {
        return profileRepository.findById(profileId)
                .map(this::buildUserResponse);
    }
    
    /**
     * Create a new user (creates Supabase auth user + profile + role-specific entity)
     */
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        // 1. Validate that email is unique
        if (profileRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("User with email " + request.getEmail() + " already exists");
        }
        
        // 2. Create Supabase auth user
        String userId = createSupabaseAuthUser(request.getEmail(), request.getPassword(), request.getFullName());
        
        try {
            // 3. Create Profile
            Profile profile = new Profile();
            profile.setUserId(userId);
            profile.setEmail(request.getEmail());
            profile.setFullName(request.getFullName());
            profile.setAvatarUrl(request.getAvatarUrl());
            profile = profileRepository.save(profile);
            
            // 4. Create role-specific entity
            Patient patient = null;
            Staff staff = null;
            Admin admin = null;
            
            switch (request.getRole().toLowerCase()) {
                case "patient":
                    patient = createPatient(userId, request);
                    break;
                case "staff":
                    staff = createStaff(userId, request);
                    break;
                case "admin":
                    admin = createAdmin(userId);
                    break;
                default:
                    throw new ValidationException("Invalid role: " + request.getRole());
            }
            
            // 5. Return combined user response
            return UserResponse.from(profile, patient, staff, admin);
            
        } catch (Exception e) {
            // Rollback: Delete Supabase user if database operations fail
            deleteSupabaseAuthUser(userId);
            throw e;
        }
    }
    
    /**
     * Update existing user (updates profile and/or role-specific data)
     */
    @Transactional
    public UserResponse updateUser(Long profileId, UpdateUserRequest request) {
        // 1. Fetch profile
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + profileId));
        
        // 2. Update profile fields
        if (request.getFullName() != null) {
            profile.setFullName(request.getFullName());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }
        profile = profileRepository.save(profile);
        
        String userId = profile.getUserId();
        
        // 3. Update role-specific data
        Patient patient = patientRepository.findByUserId(userId).orElse(null);
        Staff staff = staffRepository.findByUserId(userId).orElse(null);
        Admin admin = adminRepository.findByUserId(userId).orElse(null);
        
        // Update patient data if exists
        if (patient != null) {
            if (request.getNric() != null) patient.setNric(request.getNric());
            if (request.getPhone() != null) patient.setPhone(request.getPhone());
            if (request.getDob() != null) patient.setDob(request.getDob());
            if (request.getAddress() != null) patient.setAddress(request.getAddress());
            patient = patientRepository.save(patient);
        }
        
        // Update staff data if exists
        if (staff != null) {
            if (request.getClinicId() != null) {
                Clinic clinic = clinicRepository.findById(request.getClinicId())
                        .orElseThrow(() -> new NotFoundException("Clinic not found with id: " + request.getClinicId()));
                staff.setClinic(clinic);
            }
            if (request.getStaffRole() != null) {
                staff.setRole(request.getStaffRole());
            }
            staff = staffRepository.save(staff);
        }
        
        // 4. Return updated user response
        return UserResponse.from(profile, patient, staff, admin);
    }
    
    /**
     * Delete user (deletes role-specific entity, profile, and Supabase auth user)
     */
    @Transactional
    public void deleteUser(Long profileId) {
        // 1. Fetch profile
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + profileId));
        
        String userId = profile.getUserId();
        
        // 2. Delete role-specific entities
        patientRepository.findByUserId(userId).ifPresent(patientRepository::delete);
        staffRepository.findByUserId(userId).ifPresent(staffRepository::delete);
        adminRepository.findByUserId(userId).ifPresent(adminRepository::delete);
        
        // 3. Delete profile
        profileRepository.delete(profile);
        
        // 4. Delete Supabase auth user
        deleteSupabaseAuthUser(userId);
    }
    
    // ==================== PRIVATE HELPER METHODS ====================
    
    /**
     * Build UserResponse from profile by fetching role-specific data
     */
    private UserResponse buildUserResponse(Profile profile) {
        String userId = profile.getUserId();
        
        Patient patient = patientRepository.findByUserId(userId).orElse(null);
        Staff staff = staffRepository.findByUserId(userId).orElse(null);
        Admin admin = adminRepository.findByUserId(userId).orElse(null);
        
        return UserResponse.from(profile, patient, staff, admin);
    }
    
    /**
     * Create patient entity
     */
    private Patient createPatient(String userId, CreateUserRequest request) {
        Patient patient = new Patient();
        patient.setUserId(userId);
        patient.setNric(request.getNric());
        patient.setPhone(request.getPhone());
        patient.setDob(request.getDob());
        patient.setAddress(request.getAddress());
        return patientRepository.save(patient);
    }
    
    /**
     * Create staff entity
     */
    private Staff createStaff(String userId, CreateUserRequest request) {
        if (request.getClinicId() == null) {
            throw new ValidationException("Clinic ID is required for staff users");
        }
        if (request.getStaffRole() == null || request.getStaffRole().isEmpty()) {
            throw new ValidationException("Staff role is required for staff users");
        }
        
        Clinic clinic = clinicRepository.findById(request.getClinicId())
                .orElseThrow(() -> new NotFoundException("Clinic not found with id: " + request.getClinicId()));
        
        Staff staff = new Staff();
        staff.setUserId(userId);
        staff.setClinic(clinic);
        staff.setRole(request.getStaffRole());
        return staffRepository.save(staff);
    }
    
    /**
     * Create admin entity
     */
    private Admin createAdmin(String userId) {
        Admin admin = new Admin();
        admin.setUserId(userId);
        return adminRepository.save(admin);
    }
    
    /**
     * Create Supabase auth user using Admin API
     * @return UUID of created user
     */
    private String createSupabaseAuthUser(String email, String password, String fullName) {
        String url = supabaseUrl + "/auth/v1/admin/users";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseServiceKey);
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("email", email);
        requestBody.put("password", password);
        requestBody.put("email_confirm", true); // Auto-confirm email
        
        Map<String, String> userMetadata = new HashMap<>();
        userMetadata.put("full_name", fullName);
        requestBody.put("user_metadata", userMetadata);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody == null || !responseBody.containsKey("id")) {
                throw new RuntimeException("Failed to create Supabase user: Invalid response");
            }
            
            return (String) responseBody.get("id");
            
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Failed to create Supabase user: " + e.getMessage());
        }
    }
    
    /**
     * Delete Supabase auth user using Admin API
     * Note: This method catches all exceptions including timeouts because:
     * 1. Database cleanup is more important than Supabase auth deletion
     * 2. Supabase may timeout but still complete the deletion successfully
     * 3. If user doesn't exist (404), that's acceptable
     */
    private void deleteSupabaseAuthUser(String userId) {
        String url = supabaseUrl + "/auth/v1/admin/users/" + userId;
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", supabaseServiceKey);
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        
        try {
            restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);
            logger.info("Successfully deleted Supabase auth user: {}", userId);
        } catch (Exception e) {
            // Log but don't throw - catches all exceptions including:
            // - HttpClientErrorException (4xx errors like 404 Not Found)
            // - HttpServerErrorException (5xx errors like 504 Gateway Timeout)
            // - ResourceAccessException (network/timeout issues)
            logger.warn("Failed to delete Supabase auth user {}: {}. User may have been deleted despite the error. Database cleanup completed successfully.", 
                       userId, e.getMessage());
        }
    }
}