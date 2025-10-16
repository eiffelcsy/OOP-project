package com.clinic.management.repository;

import com.clinic.management.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
     * This is the primary way to look up a profile from JWT authentication
     * @param userId UUID from auth.users.id (as String)
     * @return Optional containing the profile if found
     */
    @Query(value = "SELECT * FROM profiles WHERE user_id = CAST(:userId AS uuid)", nativeQuery = true)
    Optional<Profile> findByUserId(@Param("userId") String userId);
    
    /**
     * Find profile by email address
     * @param email User's email
     * @return Optional containing the profile if found
     */
    Optional<Profile> findByEmail(String email);
    
    /**
     * Check if a profile exists for a given user ID
     * @param userId UUID from auth.users.id (as String)
     * @return true if profile exists
     */
    @Query(value = "SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = CAST(:userId AS uuid))", nativeQuery = true)
    boolean existsByUserId(@Param("userId") String userId);
    
    /**
     * Check if a profile exists with the given email
     * @param email User's email
     * @return true if profile exists
     */
    boolean existsByEmail(String email);
    
    /**
     * Delete profile by user ID
     * @param userId UUID from auth.users.id (as String)
     */
    @Modifying
    @Query(value = "DELETE FROM profiles WHERE user_id = CAST(:userId AS uuid)", nativeQuery = true)
    void deleteByUserId(@Param("userId") String userId);
}

