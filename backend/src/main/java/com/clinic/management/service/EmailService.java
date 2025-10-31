package com.clinic.management.service;

import com.clinic.management.model.Appointment;
import org.springframework.scheduling.annotation.Async;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Simple service for sending appointment notification emails using Resend API.
 *
 * Configure the following environment properties (do NOT hardcode API keys in source):
 * - resend.api.key
 * - resend.domain
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final String apiKey;
    private final String domain;
    private final HttpClient client;
    private final ObjectMapper mapper = new ObjectMapper();

    public EmailService(@Value("${resend.api.key:}") String apiKey,
                        @Value("${resend.domain:}") String domain) {
        this.apiKey = apiKey;
        this.domain = domain;
        this.client = HttpClient.newHttpClient();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && domain != null && !domain.isBlank();
    }

    @Async
    public void sendAppointmentScheduledEmail(Appointment appointment, String toEmail, String patientName, String clinicName, String doctorName) {
        if (!isConfigured()) {
            log.warn("EmailService not configured (missing API key or domain) — skipping email for appointment id={}", appointment.getId());
            return;
        }

        try {
            String from = String.format("clinic@%s", domain);

            // Format appointment time in clinic timezone for readability
            ZoneId clinicZone = ZoneId.of("Asia/Singapore");
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm (z)").withZone(clinicZone);
            String start = appointment.getStartTime() != null ? dtf.format(appointment.getStartTime()) : "n/a";
            String end = appointment.getEndTime() != null ? dtf.format(appointment.getEndTime()) : "n/a";

        String subject = "Your appointment is scheduled";
        String html = String.format(
            "<html><body>" +
            "<p>Hi %s,</p>" +
            "<p>Your appointment has been scheduled:</p>" +
            "<ul>" +
            "<li><strong>Date & Time:</strong> %s - %s</li>" +
            "<li><strong>Clinic:</strong> %s</li>" +
            "<li><strong>Doctor:</strong> %s</li>" +
            "</ul>" +
            "<p>If you have any questions, reply to this email.</p>" +
            "</body></html>",
            (patientName == null || patientName.isBlank()) ? "Patient" : patientName,
            start,
            end,
            (clinicName == null ? (appointment.getClinicId() != null ? appointment.getClinicId().toString() : "") : clinicName),
            (doctorName == null ? (appointment.getDoctorId() != null ? appointment.getDoctorId().toString() : "") : doctorName)
        );

            Map<String, Object> body = new HashMap<>();
            body.put("from", from);
            body.put("to", new String[]{ toEmail });
            body.put("subject", subject);
            body.put("html", html);

            String json = mapper.writeValueAsString(body);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                log.info("Sent appointment email to {} for appointment id={}", toEmail, appointment.getId());
            } else {
                log.warn("Failed to send appointment email (status={}): {}", resp.statusCode(), resp.body());
            }
        } catch (Exception ex) {
            log.error("Error while sending appointment email for id=" + appointment.getId(), ex);
        }
    }
}
