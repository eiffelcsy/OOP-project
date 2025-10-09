package com.clinic.management.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    @GetMapping("/me")
    public Map<String, Object> getCurrentUser(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return Map.of(
            "userId", userId,
            "authenticated", true
        );
    }

    @GetMapping("/protected")
    public Map<String, String> protectedEndpoint() {
        return Map.of("message", "This is a protected endpoint");
    }
}