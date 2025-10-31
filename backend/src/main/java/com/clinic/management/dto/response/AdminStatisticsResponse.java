package com.clinic.management.dto.response;

import java.util.Map;

/**
 * Response DTO for admin dashboard statistics
 */
public class AdminStatisticsResponse {
    
    private Map<String, Object> metrics;
    
    private Map<String, Object> systemStatus;
    
    private Map<String, Object> systemUsage;
    
    public AdminStatisticsResponse() {
    }
    
    public AdminStatisticsResponse(Map<String, Object> metrics, Map<String, Object> systemStatus, Map<String, Object> systemUsage) {
        this.metrics = metrics;
        this.systemStatus = systemStatus;
        this.systemUsage = systemUsage;
    }
    
    // Getters and Setters
    public Map<String, Object> getMetrics() {
        return metrics;
    }
    
    public void setMetrics(Map<String, Object> metrics) {
        this.metrics = metrics;
    }
    
    public Map<String, Object> getSystemStatus() {
        return systemStatus;
    }
    
    public void setSystemStatus(Map<String, Object> systemStatus) {
        this.systemStatus = systemStatus;
    }
    
    public Map<String, Object> getSystemUsage() {
        return systemUsage;
    }
    
    public void setSystemUsage(Map<String, Object> systemUsage) {
        this.systemUsage = systemUsage;
    }
}

