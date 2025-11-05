package com.clinic.management.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.web.client.RestTemplate;

import java.time.LocalTime;
import java.util.TimeZone;

/**
 * Jackson configuration for JSON serialization/deserialization
 * Configures snake_case naming strategy to match database schema and frontend expectations
 * Configures date/time serialization as ISO-8601 strings instead of arrays
 * Sets timezone to Singapore and uses custom LocalTime serializers to ensure
 * time-of-day values are not affected by timezone conversions
 */
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        // Create a custom module for LocalTime handling
        SimpleModule localTimeModule = new SimpleModule();
        localTimeModule.addSerializer(LocalTime.class, new LocalTimeSerializer());
        localTimeModule.addDeserializer(LocalTime.class, new LocalTimeDeserializer());
        
        return Jackson2ObjectMapperBuilder.json()
                .propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
                .modules(new JavaTimeModule(), localTimeModule)
                .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .timeZone(TimeZone.getTimeZone(TimezoneConfig.CLINIC_ZONE))
                .build();
    }
    
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        
        RestTemplate restTemplate = new RestTemplate(factory);
        return restTemplate;
    }
}

