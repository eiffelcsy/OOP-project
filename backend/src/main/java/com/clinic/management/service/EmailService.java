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
    public void sendAppointmentScheduledEmail(Appointment appointment, String toEmail, String patientName, String clinicName, String doctorName, String clinicAddress) {
        if (!isConfigured()) {
            log.warn("EmailService not configured (missing API key or domain) — skipping email for appointment id={}", appointment.getId());
            return;
        }

        try {
            String from = String.format("clinic@%s", domain);

            // Format appointment time in clinic timezone for readability
            ZoneId clinicZone = ZoneId.of("Asia/Singapore");
            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(clinicZone);
            DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(clinicZone);

            String startDate = appointment.getStartTime() != null ? dateFmt.format(appointment.getStartTime()) : "n/a";
            String startTime = appointment.getStartTime() != null ? timeFmt.format(appointment.getStartTime()) : "n/a";
            String endDate = appointment.getEndTime() != null ? dateFmt.format(appointment.getEndTime()) : "n/a";
            String endTime = appointment.getEndTime() != null ? timeFmt.format(appointment.getEndTime()) : "n/a";

            String subject = String.format("Appointment Confirmation — %s — %s %s (SGT)",
                    clinicName == null ? "Clinic" : clinicName, startDate, startTime);

            String html = String.format(
                "<html><body>" +
                "<h2>🩺 Appointment Scheduled Email</h2>" +
                "<p>Dear %s,</p>" +
                "<p>Your appointment has been successfully scheduled.<br/>Please find the details below:</p>" +
                "<p><strong>Date & Time:</strong> %s %s – %s %s (SGT)</p>" +
                "<p><strong>Clinic:</strong> %s<br/>" +
                "<strong>Doctor:</strong> Dr. %s</p>" +
                "<p>If you wish to make any changes or cancel your appointment, please contact the clinic in advance.<br/>We look forward to seeing you.</p>" +
                "<p>Warm regards,<br/>%s<br/>%s</p>" +
                "</body></html>",
                (patientName == null || patientName.isBlank()) ? "Patient" : patientName,
                startDate,
                startTime,
                endDate,
                endTime,
                (clinicName == null ? (appointment.getClinicId() != null ? appointment.getClinicId().toString() : "") : clinicName),
                (doctorName == null ? (appointment.getDoctorId() != null ? appointment.getDoctorId().toString() : "") : doctorName),
                (clinicName == null ? "Clinic" : clinicName),
                (clinicAddress == null ? "" : clinicAddress)
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

    @Async
    public void sendAppointmentRescheduledEmail(Appointment appointment, String toEmail, String patientName, String clinicName, String doctorName, String clinicAddress) {
        if (!isConfigured()) {
            log.warn("EmailService not configured (missing API key or domain) — skipping reschedule email for appointment id={}", appointment.getId());
            return;
        }

        try {
            String from = String.format("clinic@%s", domain);

            // Format appointment time in clinic timezone for readability
            ZoneId clinicZone = ZoneId.of("Asia/Singapore");
            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(clinicZone);
            DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(clinicZone);

            String startDate = appointment.getStartTime() != null ? dateFmt.format(appointment.getStartTime()) : "n/a";
            String startTime = appointment.getStartTime() != null ? timeFmt.format(appointment.getStartTime()) : "n/a";
            String endDate = appointment.getEndTime() != null ? dateFmt.format(appointment.getEndTime()) : "n/a";
            String endTime = appointment.getEndTime() != null ? timeFmt.format(appointment.getEndTime()) : "n/a";

            String subject = String.format("Appointment Updated — %s — %s %s (SGT)",
                    clinicName == null ? "Clinic" : clinicName, startDate, startTime);

            String html = String.format(
                "<html><body>" +
                "<h2>🩺 Appointment Scheduled Email</h2>" +
                "<p>Dear %s,</p>" +
                "<p>Your appointment has been updated. Please find the details below:</p>" +
                "<p><strong>Date & Time:</strong> %s %s – %s %s (SGT)</p>" +
                "<p><strong>Clinic:</strong> %s<br/>" +
                "<strong>Doctor:</strong> Dr. %s</p>" +
                "<p>If you did not request this change or have any questions, please contact the clinic.</p>" +
                "<p>Warm regards,<br/>%s<br/>%s</p>" +
                "</body></html>",
                (patientName == null || patientName.isBlank()) ? "Patient" : patientName,
                startDate,
                startTime,
                endDate,
                endTime,
                (clinicName == null ? (appointment.getClinicId() != null ? appointment.getClinicId().toString() : "") : clinicName),
                (doctorName == null ? (appointment.getDoctorId() != null ? appointment.getDoctorId().toString() : "") : doctorName),
                (clinicName == null ? "Clinic" : clinicName),
                (clinicAddress == null ? "" : clinicAddress)
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
                log.info("Sent reschedule email to {} for appointment id={}", toEmail, appointment.getId());
            } else {
                log.warn("Failed to send reschedule email (status={}): {}", resp.statusCode(), resp.body());
            }
        } catch (Exception ex) {
            log.error("Error while sending reschedule email for id=" + appointment.getId(), ex);
        }
    }

    @Async
    public void sendAppointmentCancelledEmail(Appointment appointment, String toEmail, String patientName, String clinicName, String doctorName, String clinicAddress) {
        if (!isConfigured()) {
            log.warn("EmailService not configured (missing API key or domain) — skipping cancelled email for appointment id={}", appointment.getId());
            return;
        }

        try {
            String from = String.format("clinic@%s", domain);

            ZoneId clinicZone = ZoneId.of("Asia/Singapore");
            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(clinicZone);
            DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(clinicZone);

            String cancelDate = appointment.getStartTime() != null ? dateFmt.format(appointment.getStartTime()) : "n/a";
            String cancelTime = appointment.getStartTime() != null ? timeFmt.format(appointment.getStartTime()) : "n/a";
            String endDate = appointment.getEndTime() != null ? dateFmt.format(appointment.getEndTime()) : "n/a";
            String endTime = appointment.getEndTime() != null ? timeFmt.format(appointment.getEndTime()) : "n/a";

            String subject = String.format("Appointment Cancelled — %s — %s %s (SGT)",
                    clinicName == null ? "Clinic" : clinicName, cancelDate, cancelTime);

            String html = String.format(
                "<html><body>" +
                "<h2>🩺 Appointment Cancelled Email</h2>" +
                "<p>Dear %s,</p>" +
                "<p>Your appointment has been cancelled as per your request.<br/>Please find the cancelled appointment details below:</p>" +
                "<p><strong>Date & Time:</strong> %s %s – %s %s (SGT)</p>" +
                "<p><strong>Clinic:</strong> %s<br/>" +
                "<strong>Doctor:</strong> Dr. %s</p>" +
                "<p>If this cancellation was made in error or you wish to reschedule, please contact the clinic to arrange a new appointment.</p>" +
                "<p>Thank you for informing us in advance, and we hope to serve you again soon.</p>" +
                "<p>Warm regards,<br/>%s<br/>%s</p>" +
                "</body></html>",
                (patientName == null || patientName.isBlank()) ? "Patient" : patientName,
                cancelDate,
                cancelTime,
                endDate,
                endTime,
                (clinicName == null ? (appointment.getClinicId() != null ? appointment.getClinicId().toString() : "") : clinicName),
                (doctorName == null ? (appointment.getDoctorId() != null ? appointment.getDoctorId().toString() : "") : doctorName),
                (clinicName == null ? "Clinic" : clinicName),
                (clinicAddress == null ? "" : clinicAddress)
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
                log.info("Sent cancelled appointment email to {} for appointment id={}", toEmail, appointment.getId());
            } else {
                log.warn("Failed to send cancelled appointment email (status={}): {}", resp.statusCode(), resp.body());
            }
        } catch (Exception ex) {
            log.error("Error while sending cancelled appointment email for id=" + appointment.getId(), ex);
        }
    }

    @Async
    public void sendQueueApproachingEmail(String toEmail, String patientName, int queueNumber, String clinicName) {
        if (!isConfigured()) {
            log.warn("EmailService not configured - skipping queue notification for patient {}", patientName);
            return;
        }

        try {
            String from = String.format("clinic@%s", domain);
            String subject = "Your turn is approaching";
            String html = String.format(
                "<html><body>" +
                "<p>Hi %s,</p>" +
                "<p>Your queue number %d will be called soon at %s.</p>" +
                "<p>Please ensure you are in the clinic.</p>" +
                "</body></html>",
                patientName,
                queueNumber,
                clinicName
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
                log.info("Sent queue approaching email to {} for queue number {}", toEmail, queueNumber);
            } else {
                log.warn("Failed to send queue approaching email (status={}): {}", resp.statusCode(), resp.body());
            }
        } catch (Exception ex) {
            log.error("Error sending queue notification email", ex);
        }
    }

    @Async
    public void sendQueueCalledEmail(String toEmail, String patientName, String doctorName, String clinicName) {
        if (!isConfigured()) {
            log.warn("EmailService not configured - skipping queue called notification for patient {}", patientName);
            return;
        }

        try {
            String from = String.format("clinic@%s", domain);
            String subject = "Please proceed to your doctor";
            String html = String.format(
                "<html><body>" +
                "<p>Hi %s,</p>" +
                "<p>It's your turn! Please proceed to Dr. %s at %s.</p>" +
                "<p>If you are not present, you may be marked as 'No Show' after a brief waiting period.</p>" +
                "</body></html>",
                patientName,
                doctorName,
                clinicName
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
                log.info("Sent queue called email to {} for doctor {}", toEmail, doctorName);
            } else {
                log.warn("Failed to send queue called email (status={}): {}", resp.statusCode(), resp.body());
            }
        } catch (Exception ex) {
            log.error("Error sending queue called email", ex);
        }
    }


}
