package com.clinic.management.exception;

/**
 * Custom exception classes for the application
 */
public class CustomExceptions {
    
    /**
     * Exception thrown when a requested resource is not found
     */
    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) {
            super(message);
        }
        
        public NotFoundException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    /**
     * Exception thrown when validation fails
     */
    public static class ValidationException extends RuntimeException {
        public ValidationException(String message) {
            super(message);
        }
        
        public ValidationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    /**
     * Exception thrown when a repository/database operation fails
     */
    public static class RepositoryException extends RuntimeException {
        public RepositoryException(String message) {
            super(message);
        }
        
        public RepositoryException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    /**
     * Exception thrown when optimistic locking fails
     * (e.g., when expectedUpdatedAt doesn't match current value)
     */
    public static class OptimisticLockException extends RuntimeException {
        public OptimisticLockException(String message) {
            super(message);
        }
        
        public OptimisticLockException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

