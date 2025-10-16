package com.clinic.management.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.UUID;

/**
 * JPA Converter to handle UUID to String conversion for PostgreSQL UUID columns
 * This converter ensures that String UUIDs are properly cast to PostgreSQL UUID type
 */
@Converter(autoApply = false)
public class UuidToStringConverter implements AttributeConverter<String, UUID> {
    
    @Override
    public UUID convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return UUID.fromString(attribute);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid UUID format: " + attribute, e);
        }
    }
    
    @Override
    public String convertToEntityAttribute(UUID dbData) {
        return dbData == null ? null : dbData.toString();
    }
}
