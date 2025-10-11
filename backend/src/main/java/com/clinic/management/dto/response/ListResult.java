package com.clinic.management.dto.response;

import java.util.List;
import java.util.Optional;

/**
 * Generic list result wrapper
 * Contains paginated data and optional total count
 * 
 * @param <T> Type of data in the list
 */
public class ListResult<T> {
    
    private List<T> data;
    private Long count;
    
    // Constructors
    public ListResult() {
    }
    
    public ListResult(List<T> data) {
        this.data = data;
    }
    
    public ListResult(List<T> data, Long count) {
        this.data = data;
        this.count = count;
    }
    
    // Static factory methods
    public static <T> ListResult<T> of(List<T> data) {
        return new ListResult<>(data);
    }
    
    public static <T> ListResult<T> of(List<T> data, Long count) {
        return new ListResult<>(data, count);
    }
    
    // Getters and Setters
    public List<T> getData() {
        return data;
    }
    
    public void setData(List<T> data) {
        this.data = data;
    }
    
    public Optional<Long> getCount() {
        return Optional.ofNullable(count);
    }
    
    public void setCount(Long count) {
        this.count = count;
    }
}
