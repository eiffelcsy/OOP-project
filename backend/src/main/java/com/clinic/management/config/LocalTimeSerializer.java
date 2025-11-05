package com.clinic.management.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * Custom Jackson serializer for LocalTime to ensure consistent HH:MM:SS format
 * without any timezone interpretation or conversion.
 * 
 * This serializer explicitly formats LocalTime as a simple time string,
 * ensuring that 09:00:00 stored in the database is serialized as "09:00:00" in JSON,
 * regardless of JVM timezone settings.
 */
public class LocalTimeSerializer extends JsonSerializer<LocalTime> {
    
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");
    
    @Override
    public void serialize(LocalTime value, JsonGenerator gen, SerializerProvider serializers) 
            throws IOException {
        if (value == null) {
            gen.writeNull();
        } else {
            gen.writeString(value.format(FORMATTER));
        }
    }
}

