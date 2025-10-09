package com.clinic.management.repository;

import com.clinic.management.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Profile entity
 * Provides database access for user profile information
 */
@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {
    
    /**
     * Find profile by Supabase auth user ID
     * @param userId UUID from auth.users.id
     * @return Optional containing the profile if found
     */
    Optional<Profile> findByUserId(String userId);
    
    /**
     * Find profile by email address
     * @param email User's email
     * @return Optional containing the profile if found
     */
    Optional<Profile> findByEmail(String email);
    
    /**
     * Check if a profile exists for a given user ID
     * @param userId UUID from auth.users.id
     * @return true if profile exists
     */
    boolean existsByUserId(String userId);
    
    /**
     * Check if a profile exists with the given email
     * @param email User's email
     * @return true if profile exists
     */
    boolean existsByEmail(String email);
    
    /**
     * Delete profile by user ID
     * @param userId UUID from auth.users.id
     */
    void deleteByUserId(String userId);
}

