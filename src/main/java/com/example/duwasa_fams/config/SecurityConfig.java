package com.example.duwasa_fams.config;

import com.example.duwasa_fams.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.core.userdetails.UserDetailsService;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            UserDetailsService userDetailsService) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http)
            throws Exception {

        http
                // REST API + JWT
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // ==========================================
                        // PUBLIC
                        // ==========================================

                        .requestMatchers(
                                "/api/users/register",
                                "/api/users/login"
                        ).permitAll()


                        // ==========================================
                        // SYSTEM ADMIN
                        // ==========================================

                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("SYSTEM_ADMIN")


                        // ==========================================
                        // HR OFFICER - APPLICATION REVIEW
                        // ==========================================

                        .requestMatchers(
                                "/api/applications/hr-review",
                                "/api/applications/*/validate",
                                "/api/applications/*/check-requirements",
                                "/api/applications/*/available-slot",
                                "/api/applications/*/forward-to-department",
                                "/api/applications/*/reject-by-hr"
                        ).hasRole("HR_OFFICER")


                        // ==========================================
                        // APPLICATION DOCUMENTS
                        // ==========================================

                        // Document ownership and workflow status are checked
                        // in ApplicationDocumentService.
                        .requestMatchers(
                                "/api/application-documents/upload"
                        ).authenticated()


                        // HR can verify/reject documents
                        .requestMatchers(
                                "/api/application-documents/*/verify"
                        ).hasRole("HR_OFFICER")


                        // Ownership and workflow status are checked in the
                        // document service for every read operation.
                        .requestMatchers(
                                "/api/application-documents/*/view"
                        ).authenticated()


                        .requestMatchers(
                                "/api/application-documents/*/download"
                        ).authenticated()


                        // Get document information / delete document.
                        .requestMatchers(
                                "/api/application-documents/*"
                        ).authenticated()


                        // Get all documents.
                        .requestMatchers(
                                "/api/application-documents"
                        ).authenticated()


                        // ==========================================
                        // DEPARTMENT COORDINATOR
                        // ==========================================

                        .requestMatchers(
                                "/api/department-coordinators/**"
                        ).hasRole("DEPARTMENT_COORDINATOR")


                        // ==========================================
                        // STUDENT
                        // ==========================================

                        .requestMatchers(
                                "/api/students/**",
                                "/api/applications/student/**"
                        ).hasRole("STUDENT")


                        // ==========================================
                        // EVERYTHING ELSE
                        // ==========================================

                        .anyRequest().authenticated()
                )

                .authenticationProvider(
                        authenticationProvider()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
