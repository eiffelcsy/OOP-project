package com.clinic.management.model.enums;

/**
 * Queue status enumeration
 * 
 * Maps to database text values in queues.queue_status column
 * Database values stored in lowercase: active, paused, closed
 * 
 * - ACTIVE: Queue is currently active and accepting patients
 * - PAUSED: Queue is temporarily paused
 * - CLOSED: Queue is closed for the day
 */
public enum QueueStatus {
    /**
     * Queue is currently active and accepting patients
     */
    ACTIVE("active"),
    
    /**
     * Queue is temporarily paused
     */
    PAUSED("paused"),
    
    /**
     * Queue is closed for the day
     */
    CLOSED("closed");
    
    private final String dbValue;
    
    QueueStatus(String dbValue) {
        this.dbValue = dbValue;
    }
    
    /**
     * Get the database string value for this status
     * @return lowercase database value
     */
    public String getDbValue() {
        return dbValue;
    }
    
    /**
     * Convert database string value to enum
     * @param dbValue database string (active, paused, closed)
     * @return corresponding QueueStatus enum
     * @throws IllegalArgumentException if dbValue is invalid
     */
    public static QueueStatus fromDbValue(String dbValue) {
        if (dbValue == null) {
            throw new IllegalArgumentException("Queue status cannot be null");
        }
        
        for (QueueStatus status : values()) {
            if (status.dbValue.equalsIgnoreCase(dbValue)) {
                return status;
            }
        }
        
        throw new IllegalArgumentException("Invalid queue status: " + dbValue);
    }
}
