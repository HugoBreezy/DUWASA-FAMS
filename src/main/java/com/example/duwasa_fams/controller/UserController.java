package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.User;
import com.example.duwasa_fams.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    // =========================================================
    // STUDENT REGISTRATION
    // =========================================================

    @PostMapping("/register")
    public ResponseEntity<User> registerUser(
            @RequestBody User user) {

        return ResponseEntity.ok(
                userService.registerUser(user)
        );
    }

    // =========================================================
    // LOGIN
    // =========================================================

    @PostMapping("/login")
    public ResponseEntity<User> login(
            @RequestBody Map<String, String> loginRequest) {

        String email =
                loginRequest.get("email");

        String password =
                loginRequest.get("password");

        return ResponseEntity.ok(
                userService.login(
                        email,
                        password)
        );
    }

    // =========================================================
    // GET ALL USERS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<User>>
    getAllUsers() {

        return ResponseEntity.ok(
                userService.getAllUsers()
        );
    }

    // =========================================================
    // GET USER BY ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<User>
    getUserById(
            @PathVariable Integer id) {

        return userService
                .getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    // =========================================================
    // UPDATE USER
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<User>
    updateUser(
            @PathVariable Integer id,
            @RequestBody User user) {

        return ResponseEntity.ok(
                userService.updateUser(
                        id,
                        user)
        );
    }

    // =========================================================
    // CHANGE USER ROLE
    // =========================================================

    @PatchMapping("/{id}/role")
    public ResponseEntity<User>
    changeRole(
            @PathVariable Integer id,
            @RequestParam String role) {

        return ResponseEntity.ok(
                userService.changeRole(
                        id,
                        role)
        );
    }

    // =========================================================
    // DELETE USER
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteUser(
            @PathVariable Integer id) {

        userService.deleteUser(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}