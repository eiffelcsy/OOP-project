package com.clinic.management.dto.request;

import com.clinic.management.model.enums.QueueStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

import java.util.ArrayList;
import java.util.List;

/**
 * Options for listing/filtering queues
 * 
 * Pagination:
 * - page: zero-based page number (default 0)
 * - size: page size (default 50, max recommended 100)
 * 
 * Sorting:
 * - sortBy: field to sort by (default "created_at")
 *   Valid values: "created_at", "updated_at", "id"
 * - sortDir: sort direction (ASC or DESC, default DESC)
 * 
 * Filtering:
 * - clinicId: filter by specific clinic
 * - statuses: filter by queue statuses (can specify multiple)
 * 
 * Other:
 * - includeCount: if true, return total count of matching records
 */
public class ListQueuesOptions {
    
    @Min(value = 0, message = "Page number must be 0 or greater")
    private int page = 0;
    
    @Positive(message = "Page size must be positive")
    @Min(value = 1, message = "Page size must be at least 1")
    private int size = 50;
    
    private String sortBy = "created_at";
    
    private SortDirection sortDir = SortDirection.DESC;
    
    private Long clinicId;
    
    private List<QueueStatus> statuses = new ArrayList<>();
    
    private boolean includeCount = false;
    
    // Constructors
    public ListQueuesOptions() {
    }
    
    // Getters and Setters
    public int getPage() {
        return page;
    }
    
    public void setPage(int page) {
        this.page = page;
    }
    
    public int getSize() {
        return size;
    }
    
    public void setSize(int size) {
        this.size = size;
    }
    
    public String getSortBy() {
        return sortBy;
    }
    
    public void setSortBy(String sortBy) {
        // Whitelist allowed sort fields to prevent SQL injection
        List<String> allowedFields = List.of("created_at", "updated_at", "id");
        if (allowedFields.contains(sortBy.toLowerCase())) {
            this.sortBy = sortBy;
        } else {
            this.sortBy = "created_at"; // default fallback
        }
    }
    
    public SortDirection getSortDir() {
        return sortDir;
    }
    
    public void setSortDir(SortDirection sortDir) {
        this.sortDir = sortDir;
    }
    
    public Long getClinicId() {
        return clinicId;
    }
    
    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }
    
    public List<QueueStatus> getStatuses() {
        return statuses;
    }
    
    /**
     * Set statuses from comma-separated string or list (for query parameter parsing)
     * This allows the frontend to send: statuses=ACTIVE,PAUSED
     * Spring will call this with the comma-separated string
     * @param statusesInput Either comma-separated string or list of status values
     */
    public void setStatuses(Object statusesInput) {
        if (statusesInput == null) {
            this.statuses = new ArrayList<>();
            return;
        }
        
        // If it's already a list, use it directly
        if (statusesInput instanceof List) {
            @SuppressWarnings("unchecked")
            List<QueueStatus> statusList = (List<QueueStatus>) statusesInput;
            this.statuses = statusList;
            return;
        }
        
        // Otherwise, treat it as a string
        String statusesStr = statusesInput.toString();
        if (statusesStr.trim().isEmpty()) {
            this.statuses = new ArrayList<>();
            return;
        }
        
        String[] statusArray = statusesStr.split(",");
        List<QueueStatus> parsedStatuses = new ArrayList<>();
        
        for (String status : statusArray) {
            try {
                parsedStatuses.add(QueueStatus.valueOf(status.trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Skip invalid status values
                System.err.println("Invalid queue status: " + status);
            }
        }
        
        this.statuses = parsedStatuses;
    }
    
    public boolean isIncludeCount() {
        return includeCount;
    }
    
    public void setIncludeCount(boolean includeCount) {
        this.includeCount = includeCount;
    }
    
    /**
     * Calculate offset for pagination
     * @return offset value
     */
    public int getOffset() {
        return page * size;
    }
    
    /**
     * Sort direction enum
     */
    public enum SortDirection {
        ASC, DESC
    }
}
