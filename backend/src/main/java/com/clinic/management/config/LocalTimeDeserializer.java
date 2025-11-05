package com.clinic.management.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Custom Jackson deserializer for LocalTime to ensure consistent parsing
 * without any timezone interpretation or conversion.
 * 
 * This deserializer handles various time formats and ensures that
 * "09:00" or "09:00:00" from JSON is parsed as 09:00:00 LocalTime,
 * regardless of JVM timezone settings.
 */
public class LocalTimeDeserializer extends JsonDeserializer<LocalTime> {
    
    private static final DateTimeFormatter FORMATTER_WITH_SECONDS = DateTimeFormatter.ofPattern("HH:mm:ss");
    private static final DateTimeFormatter FORMATTER_WITHOUT_SECONDS = DateTimeFormatter.ofPattern("HH:mm");
    
    @Override
    public LocalTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String timeString = p.getText();
        
        if (timeString == null || timeString.trim().isEmpty()) {
            return null;
        }
        
        try {
            // Try parsing with seconds first
            return LocalTime.parse(timeString, FORMATTER_WITH_SECONDS);
        } catch (DateTimeParseException e1) {
            try {
                // Try without seconds
                return LocalTime.parse(timeString, FORMATTER_WITHOUT_SECONDS);
            } catch (DateTimeParseException e2) {
                // Let Jackson's default behavior handle it
                return LocalTime.parse(timeString);
            }
        }
    }
}

