package com.example.duwasa_fams.config;

import com.example.duwasa_fams.entity.User;
import com.example.duwasa_fams.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.initial-admin.email}")
    private String adminEmail;

    @Value("${app.initial-admin.password}")
    private String adminPassword;

    public DataInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        boolean adminExists =
                userRepository.findAll()
                        .stream()
                        .anyMatch(user ->
                                user.getRole() != null
                                        && user.getRole()
                                        .equals("SYSTEM_ADMIN")
                        );

        /*
         * Do not create another admin if one
         * already exists.
         */
        if (adminExists) {
            return;
        }

        User admin = new User();

        admin.setFname("System");
        admin.setLname("Administrator");
        admin.setEmail(adminEmail);
        admin.setPhone("");
        admin.setPassword(
                passwordEncoder.encode(adminPassword)
        );
        admin.setRole("SYSTEM_ADMIN");
        admin.setCreatedAt(LocalDateTime.now());

        userRepository.save(admin);

        System.out.println(
                "=========================================="
        );

        System.out.println(
                "INITIAL SYSTEM ADMIN CREATED"
        );

        System.out.println(
                "Email: " + adminEmail
        );

        System.out.println(
                "=========================================="
        );
    }
}