package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.User;
import com.example.duwasa_fams.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    private final UserService userService;

    public UserController(
            UserService userService) {

        this.userService = userService;
    }

    /*
     * PUBLIC STUDENT REGISTRATION
     */
    @PostMapping("/register")
    public ResponseEntity<User> register(
            @RequestBody User user) {

        return ResponseEntity.ok(
                userService.registerUser(user)
        );
    }

    /*
     * PUBLIC LOGIN
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> request) {

        String email =
                request.get("email");

        String password =
                request.get("password");

        String token =
                userService.login(
                        email,
                        password
                );

        return ResponseEntity.ok(
                Map.of(
                        "token",
                        token,
                        "message",
                        "Login successful"
                )
        );
    }
}