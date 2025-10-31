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

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
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
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        List<Profile> profiles = profileRepository.findAll();
        
        return profiles.stream()
                .map(this::buildUserResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get user by profile ID
     */
    @Transactional(readOnly = true)
    public Optional<UserResponse> getUserById(Long profileId) {
        return profileRepository.findById(profileId)
                .map(this::buildUserResponse);
    }
    
    /**
     * Create a new user (creates Supabase auth user + profile + role-specific entity)
     * Note: Profile creation is handled by Supabase trigger automatically
     * Note: Patient record creation is handled by Supabase trigger for patients
     */
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        // 1. Validate that email is unique
        if (profileRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("User with email " + request.getEmail() + " already exists");
        }
        
        // 2. Create Supabase auth user (trigger will create profile + patient if role=patient)
        String userId = createSupabaseAuthUser(request);
        
        logger.info("Created Supabase auth user: {}, role: {}, phone: {}", userId, request.getRole(), request.getPhone());
        
        try {
            // 3. Wait for trigger to complete (profile + patient creation)
            // Increased wait time and added retry logic for trigger completion
            Thread.sleep(1000);
            
            // 4. Fetch the profile created by trigger
            Profile profile = profileRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Profile was not created by trigger for user: " + userId));
            
            // 5. Update profile with additional fields not set by trigger
            if (request.getAvatarUrl() != null) {
                profile.setAvatarUrl(request.getAvatarUrl());
                profile = profileRepository.save(profile);
            }
            
            // 6. Create or update role-specific entity
            Patient patient = null;
            Staff staff = null;
            Admin admin = null;
            
            switch (request.getRole().toLowerCase()) {
                case "patient":
                    // For admin-created users via Admin API, trigger may not fire reliably
                    // Try to fetch existing patient record (from trigger), otherwise create manually
                    patient = getOrCreatePatient(userId, request);
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
            
            // 7. Return combined user response
            return UserResponse.from(profile, patient, staff, admin);
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            deleteSupabaseAuthUser(userId);
            throw new RuntimeException("User creation interrupted", e);
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
     * This method coordinates the deletion process:
     * 1. First commits database deletions in a transaction
     * 2. Then calls Supabase API to delete auth user
     */
    public void deleteUser(Long profileId) {
        // Step 1: Delete from database and commit transaction
        String userId = deleteDatabaseRecords(profileId);
        
        // Step 2: Delete Supabase auth user (after database commit)
        deleteSupabaseAuthUser(userId);
    }
    
    /**
     * Delete database records for user (profile and role-specific entities)
     * This runs in its own transaction and commits before returning
     * @param profileId The profile ID to delete
     * @return The userId for subsequent Supabase deletion
     */
    @Transactional
    private String deleteDatabaseRecords(Long profileId) {
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
        
        // Transaction commits here when method returns
        return userId;
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
     * Get existing patient record (created by trigger) or create one manually
     * 
     * This handles two scenarios:
     * 1. Self-registration: Patient record created automatically by Supabase trigger (signUp)
     * 2. Admin-created: Trigger may not fire reliably via Admin API, so create manually
     * 
     * Implements retry logic to handle trigger timing issues for self-registration
     */
    private Patient getOrCreatePatient(String userId, CreateUserRequest request) {
        // Try to fetch patient with retries (trigger may take time to commit for self-registration)
        Patient patient = null;
        int maxRetries = 3;
        int retryDelayMs = 500;
        
        for (int i = 0; i < maxRetries; i++) {
            patient = patientRepository.findByUserId(userId).orElse(null);
            
            if (patient != null) {
                logger.info("Found existing patient record for user {} (likely from trigger)", userId);
                break; // Found the patient record created by trigger
            }
            
            if (i < maxRetries - 1) {
                try {
                    logger.info("Patient record not found yet for user {}, retry {}/{}", userId, i + 1, maxRetries);
                    Thread.sleep(retryDelayMs);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted while waiting for patient record creation", e);
                }
            }
        }
        
        // If still not found after retries, create manually (Admin API doesn't reliably trigger)
        if (patient == null) {
            logger.info("Patient record not created by trigger for user {}, creating manually", userId);
            patient = new Patient();
            patient.setUserId(userId);
        }
        
        // Set/update all patient-specific fields
        if (request.getNric() != null) patient.setNric(request.getNric());
        if (request.getPhone() != null) patient.setPhone(request.getPhone());
        if (request.getDob() != null) patient.setDob(request.getDob());
        if (request.getAddress() != null) patient.setAddress(request.getAddress());
        
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
     * Includes metadata for trigger to create profile and patient records
     * @param request User creation request with all user data
     * @return UUID of created user
     */
    private String createSupabaseAuthUser(CreateUserRequest request) {
        String url = supabaseUrl + "/auth/v1/admin/users";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseServiceKey);
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("email", request.getEmail());
        requestBody.put("password", request.getPassword());
        requestBody.put("email_confirm", true); // Auto-confirm email
        
        // raw_user_meta_data for trigger to create profile and patient
        Map<String, String> rawUserMetadata = new HashMap<>();
        rawUserMetadata.put("full_name", request.getFullName());
        rawUserMetadata.put("user_type", request.getRole().toLowerCase());
        
        // Add phone for patient trigger (CRITICAL: trigger needs this to create patient record)
        if ("patient".equals(request.getRole().toLowerCase()) && request.getPhone() != null) {
            rawUserMetadata.put("phone", request.getPhone());
            logger.info("Creating patient user with phone: {}", request.getPhone());
        }
        
        requestBody.put("raw_user_meta_data", rawUserMetadata);
        
        // user_metadata for Supabase Auth (optional, for consistency)
        Map<String, String> userMetadata = new HashMap<>();
        userMetadata.put("full_name", request.getFullName());
        requestBody.put("user_metadata", userMetadata);
        
        logger.info("Creating Supabase auth user with role: {}, metadata: {}", request.getRole(), rawUserMetadata);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
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
     * Uses Java 11+ HttpClient with HTTP/2 support (matching curl behavior)
     * Note: This method catches all exceptions including timeouts because:
     * 1. Database cleanup is more important than Supabase auth deletion
     * 2. Supabase may timeout but still complete the deletion successfully
     * 3. If user doesn't exist (404), that's acceptable
     */
    private void deleteSupabaseAuthUser(String userId) {
        try {
            // Create HttpClient with HTTP/2 support and timeouts
            HttpClient client = HttpClient.newBuilder()
                    .version(HttpClient.Version.HTTP_2)
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
            
            // Build request with headers (same as working curl command)
            String urlString = supabaseUrl + "/auth/v1/admin/users/" + userId;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(urlString))
                    .timeout(Duration.ofSeconds(60))
                    .DELETE()
                    .header("apikey", supabaseServiceKey)
                    .header("Authorization", "Bearer " + supabaseServiceKey)
                    .build();
            
            // Send request
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            int statusCode = response.statusCode();
            
            if (statusCode >= 200 && statusCode < 300) {
                logger.info("Successfully deleted Supabase auth user: {} (Status: {})", userId, statusCode);
            } else if (statusCode == 404) {
                logger.info("Supabase auth user {} not found (404) - may have been already deleted", userId);
            } else {
                logger.warn("Failed to delete Supabase auth user {} - HTTP {}: {}. Database cleanup completed successfully.", 
                           userId, statusCode, response.body());
            }
        } catch (Exception e) {
            logger.warn("Failed to delete Supabase auth user {} - {}: {}. User may have been deleted despite the error. Database cleanup completed successfully.", 
                       userId, e.getClass().getSimpleName(), e.getMessage());
        }
    }
}