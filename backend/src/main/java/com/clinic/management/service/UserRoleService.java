package com.clinic.management.service;

import com.clinic.management.repository.AdminRepository;
import com.clinic.management.repository.PatientRepository;
import com.clinic.management.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service to determine user roles based on database records
 * Checks which table(s) a user belongs to and returns appropriate Spring Security roles
 * Used for authorization and role-based access control
 */
@Service
public class UserRoleService {
    
    private final AdminRepository adminRepository;
    private final StaffRepository staffRepository;
    private final PatientRepository patientRepository;
    
    @Autowired
    public UserRoleService(
            AdminRepository adminRepository,
            StaffRepository staffRepository,
            PatientRepository patientRepository
    ) {
        this.adminRepository = adminRepository;
        this.staffRepository = staffRepository;
        this.patientRepository = patientRepository;
    }
    
    /**
     * Get all roles for a user based on their presence in different tables
     * A user can have multiple roles (e.g., admin who is also a patient)
     * 
     * @param userId Supabase auth user ID (UUID)
     * @return List of role strings (e.g., "ADMIN", "STAFF", "PATIENT")
     * Note: Spring Security's hasRole() automatically adds "ROLE_" prefix
     */
    public List<String> getUserRoles(String userId) {
        List<String> roles = new ArrayList<>();
        
        // Check if user is an admin
        if (adminRepository.existsByUserId(userId)) {
            roles.add("ADMIN");
        }
        
        // Check if user is staff
        if (staffRepository.existsByUserId(userId)) {
            roles.add("STAFF");
        }
        
        // Check if user is a patient
        if (patientRepository.existsByUserId(userId)) {
            roles.add("PATIENT");
        }
        
        // If no specific role found, assign default user role
        if (roles.isEmpty()) {
            roles.add("USER");
        }
        
        return roles;
    }
    
    /**
     * Check if user is an admin
     * @param userId Supabase auth user ID
     * @return true if user is an admin
     */
    public boolean isAdmin(String userId) {
        return adminRepository.existsByUserId(userId);
    }
    
    /**
     * Check if user is staff
     * @param userId Supabase auth user ID
     * @return true if user is staff
     */
    public boolean isStaff(String userId) {
        return staffRepository.existsByUserId(userId);
    }
    
    /**
     * Check if user is a patient
     * @param userId Supabase auth user ID
     * @return true if user is a patient
     */
    public boolean isPatient(String userId) {
        return patientRepository.existsByUserId(userId);
    }
}

