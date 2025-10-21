package com.clinic.management.config;

import java.time.ZoneId;

/**
 * Central place for clinic timezone constants.
 */
public final class TimezoneConfig {
    public static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Singapore");
    private TimezoneConfig() {}
}
