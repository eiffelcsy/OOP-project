# Spring Data JPA Repository Guide

## Overview

This document explains the repository layer for our clinic management system, including how to use the repositories and the query methods available.

## Repository Structure

All repositories are located in:
```
backend/src/main/java/com/clinic/management/repository/
```

### Created Repositories

1. **ProfileRepository** - User profile data
2. **ClinicRepository** - Clinic information
3. **PatientRepository** - Patient records
4. **StaffRepository** - Staff member data
5. **AdminRepository** - Administrator records

## Repository Pattern

All repositories extend `JpaRepository<Entity, ID>` which provides:
- Basic CRUD operations (save, findById, findAll, delete, etc.)
- Pagination and sorting
- Batch operations
- Custom query methods

```java
public interface PatientRepository extends JpaRepository<Patient, Long> {
    // Custom query methods
}
```

## Key Query Methods

### 1. ProfileRepository

#### Find by User ID (Most Important!)
```java
Optional<Profile> findByUserId(String userId);
```
**Usage:**
```java
@Service
public class ProfileService {
    @Autowired
    private ProfileRepository profileRepository;
    
    public Profile getCurrentUserProfile(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return profileRepository.findByUserId(userId)
            .orElseThrow(() -> new NotFoundException("Profile not found"));
    }
}
```

#### Other Methods
- `findByEmail(String email)` - Find by email address
- `existsByUserId(String userId)` - Check if profile exists
- `deleteByUserId(String userId)` - Delete by user ID

---

### 2. ClinicRepository

#### Search Clinics
```java
List<Clinic> searchByName(String name);
List<Clinic> findByRegion(String region);
List<Clinic> findByArea(String area);
List<Clinic> findByRegionAndArea(String region, String area);
```

**Usage:**
```java
@RestController
@RequestMapping("/api/clinics")
public class ClinicController {
    @Autowired
    private ClinicRepository clinicRepository;
    
    @GetMapping("/search")
    public List<Clinic> searchClinics(@RequestParam String name) {
        return clinicRepository.searchByName(name);
    }
    
    @GetMapping("/region/{region}")
    public List<Clinic> getClinicsByRegion(@PathVariable String region) {
        return clinicRepository.findByRegionOrderByNameAsc(region);
    }
}
```

#### Filter by Type
```java
List<Clinic> findByClinicType(String clinicType);
```

---

### 3. PatientRepository

#### Find by User ID (Primary Method)
```java
Optional<Patient> findByUserId(String userId);
```

**Usage in Controller:**
```java
@GetMapping("/me")
public PatientDTO getCurrentPatient(Authentication auth) {
    String userId = (String) auth.getPrincipal();
    Patient patient = patientRepository.findByUserId(userId)
        .orElseThrow(() -> new NotFoundException("Patient not found"));
    return new PatientDTO(patient);
}
```

#### Find by Identifiers
```java
Optional<Patient> findByNric(String nric);
Optional<Patient> findByPhone(String phone);
```

#### Search Methods
```java
List<Patient> searchByPhone(String phone);      // Partial match
List<Patient> searchByAddress(String address);  // Case-insensitive
```

#### Validation Methods
```java
boolean existsByUserId(String userId);
boolean existsByNric(String nric);
```

**Usage:**
```java
@PostMapping("/register")
public ResponseEntity<?> registerPatient(@RequestBody PatientRequest request) {
    if (patientRepository.existsByNric(request.getNric())) {
        return ResponseEntity.badRequest()
            .body("Patient with this NRIC already exists");
    }
    // Proceed with registration
}
```

---

### 4. StaffRepository

#### Find by User ID
```java
Optional<Staff> findByUserId(String userId);
```

#### Find by Clinic
```java
List<Staff> findByClinic(Clinic clinic);
List<Staff> findByClinicId(Long clinicId);
```

**Usage:**
```java
@GetMapping("/clinics/{clinicId}/staff")
public List<StaffDTO> getClinicStaff(@PathVariable Long clinicId) {
    List<Staff> staff = staffRepository.findByClinicId(clinicId);
    return staff.stream()
        .map(StaffDTO::new)
        .collect(Collectors.toList());
}
```

#### Find by Role
```java
List<Staff> findByRole(String role);
List<Staff> findByClinicIdAndRole(Long clinicId, String role);
```

**Usage:**
```java
// Get all nurses at a specific clinic
List<Staff> nurses = staffRepository.findByClinicIdAndRole(clinicId, "nurse");

// Get all receptionists across all clinics
List<Staff> receptionists = staffRepository.findByRole("receptionist");
```

#### Count Methods
```java
long countByClinicId(Long clinicId);
long countByRole(String role);
```

---

### 5. AdminRepository

#### Find by User ID
```java
Optional<Admin> findByUserId(String userId);
```

#### Check Admin Status
```java
boolean existsByUserId(String userId);
```

**Usage:**
```java
@Service
public class AuthorizationService {
    @Autowired
    private AdminRepository adminRepository;
    
    public boolean isAdmin(String userId) {
        return adminRepository.existsByUserId(userId);
    }
}
```

#### Count Admins
```java
long countAllAdmins();
```

---

## Common Patterns

### 1. Get Current User's Data

```java
@Service
public class UserService {
    @Autowired
    private PatientRepository patientRepository;
    
    @Autowired
    private StaffRepository staffRepository;
    
    @Autowired
    private AdminRepository adminRepository;
    
    public UserRole getUserRole(String userId) {
        if (patientRepository.existsByUserId(userId)) {
            return UserRole.PATIENT;
        }
        if (staffRepository.existsByUserId(userId)) {
            return UserRole.STAFF;
        }
        if (adminRepository.existsByUserId(userId)) {
            return UserRole.ADMIN;
        }
        throw new NotFoundException("User role not found");
    }
}
```

### 2. Create New Record

```java
@PostMapping("/patients")
public ResponseEntity<Patient> createPatient(
    @RequestBody PatientRequest request,
    Authentication auth
) {
    String userId = (String) auth.getPrincipal();
    
    // Check if patient already exists
    if (patientRepository.existsByUserId(userId)) {
        return ResponseEntity.badRequest().build();
    }
    
    // Create new patient
    Patient patient = new Patient();
    patient.setUserId(userId);
    patient.setNric(request.getNric());
    patient.setDob(request.getDob());
    patient.setPhone(request.getPhone());
    patient.setAddress(request.getAddress());
    
    Patient saved = patientRepository.save(patient);
    return ResponseEntity.ok(saved);
}
```

### 3. Update Record

```java
@PutMapping("/patients/me")
public ResponseEntity<Patient> updateCurrentPatient(
    @RequestBody PatientUpdateRequest request,
    Authentication auth
) {
    String userId = (String) auth.getPrincipal();
    
    Patient patient = patientRepository.findByUserId(userId)
        .orElseThrow(() -> new NotFoundException("Patient not found"));
    
    // Update fields
    patient.setPhone(request.getPhone());
    patient.setAddress(request.getAddress());
    
    Patient updated = patientRepository.save(patient);
    return ResponseEntity.ok(updated);
}
```

### 4. Delete Record

```java
@DeleteMapping("/patients/me")
public ResponseEntity<Void> deleteCurrentPatient(Authentication auth) {
    String userId = (String) auth.getPrincipal();
    
    patientRepository.deleteByUserId(userId);
    return ResponseEntity.noContent().build();
}
```

### 5. Complex Queries with Multiple Repositories

```java
@Service
public class UserDetailsService {
    @Autowired
    private ProfileRepository profileRepository;
    
    @Autowired
    private PatientRepository patientRepository;
    
    @Autowired
    private StaffRepository staffRepository;
    
    public UserDetailsDTO getUserDetails(String userId) {
        // Get profile (everyone has one)
        Profile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new NotFoundException("Profile not found"));
        
        UserDetailsDTO dto = new UserDetailsDTO(profile);
        
        // Get role-specific data
        patientRepository.findByUserId(userId).ifPresent(patient -> {
            dto.setPatient(patient);
            dto.setRole("PATIENT");
        });
        
        staffRepository.findByUserId(userId).ifPresent(staff -> {
            dto.setStaff(staff);
            dto.setRole("STAFF");
            dto.setClinic(staff.getClinic());
        });
        
        adminRepository.findByUserId(userId).ifPresent(admin -> {
            dto.setAdmin(admin);
            dto.setRole("ADMIN");
        });
        
        return dto;
    }
}
```

## Transaction Management

For operations that modify data, use `@Transactional`:

```java
@Service
public class PatientService {
    @Autowired
    private PatientRepository patientRepository;
    
    @Autowired
    private ProfileRepository profileRepository;
    
    @Transactional
    public void deletePatientAndProfile(String userId) {
        // Both operations will be in the same transaction
        patientRepository.deleteByUserId(userId);
        profileRepository.deleteByUserId(userId);
        // If either fails, both will rollback
    }
}
```

## Pagination and Sorting

All repositories support pagination:

```java
@GetMapping("/clinics")
public Page<Clinic> getClinics(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size,
    @RequestParam(defaultValue = "name") String sortBy
) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
    return clinicRepository.findAll(pageable);
}
```

## Best Practices

### 1. Always Use Optional
```java
// ✅ Good
Optional<Patient> patient = patientRepository.findByUserId(userId);
if (patient.isPresent()) {
    // Handle patient
}

// ❌ Avoid
Patient patient = patientRepository.findByUserId(userId).get(); // Can throw exception
```

### 2. Use Exists for Validation
```java
// ✅ Good - more efficient
if (patientRepository.existsByNric(nric)) {
    throw new ValidationException("NRIC already exists");
}

// ❌ Less efficient
if (patientRepository.findByNric(nric).isPresent()) {
    throw new ValidationException("NRIC already exists");
}
```

### 3. Use Transactional for Delete Operations
```java
@Transactional
public void deleteByUserId(String userId) {
    patientRepository.deleteByUserId(userId);
}
```

### 4. Handle Not Found Cases
```java
Patient patient = patientRepository.findByUserId(userId)
    .orElseThrow(() -> new NotFoundException("Patient not found for user: " + userId));
```

## Testing Repositories

```java
@DataJpaTest
public class PatientRepositoryTest {
    
    @Autowired
    private PatientRepository patientRepository;
    
    @Test
    public void testFindByUserId() {
        // Given
        Patient patient = new Patient();
        patient.setUserId("test-uuid-123");
        patient.setNric("S1234567A");
        patientRepository.save(patient);
        
        // When
        Optional<Patient> found = patientRepository.findByUserId("test-uuid-123");
        
        // Then
        assertTrue(found.isPresent());
        assertEquals("S1234567A", found.get().getNric());
    }
}
```

## Summary

| Repository | Primary Query | Use Case |
|------------|--------------|----------|
| **ProfileRepository** | `findByUserId(String)` | Get user profile from JWT |
| **ClinicRepository** | `searchByName(String)` | Search clinics |
| **PatientRepository** | `findByUserId(String)` | Get patient from JWT |
| **StaffRepository** | `findByUserId(String)` | Get staff from JWT |
| **AdminRepository** | `findByUserId(String)` | Get admin from JWT |

All repositories provide:
- ✅ CRUD operations out of the box
- ✅ Custom query methods for common use cases
- ✅ Validation methods (`existsByX`)
- ✅ Search and filter capabilities
- ✅ Count and statistics methods

Next steps: Create service layer to implement business logic using these repositories!

