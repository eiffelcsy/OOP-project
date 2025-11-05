package com.clinic.management;

import com.clinic.management.config.TimezoneConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class ClinicApplication {
    public static void main(String[] args) {
        // Set JVM default timezone to Singapore BEFORE Spring Boot starts
        // This ensures LocalTime values from PostgreSQL are read/written correctly
        TimeZone.setDefault(TimeZone.getTimeZone(TimezoneConfig.CLINIC_ZONE));
        
        SpringApplication.run(ClinicApplication.class, args);
      }
      @GetMapping("/hello")
      public String hello(@RequestParam(value = "name", defaultValue = "World") String name) {
        return String.format("Hello %s!", name);
      }
}
