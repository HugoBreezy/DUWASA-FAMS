package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.User;
import com.example.duwasa_fams.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // =========================================================
    // REGISTER USER
    // =========================================================

    public User registerUser(User user) {

        if (user.getFname() == null
                || user.getFname().isBlank()) {

            throw new RuntimeException(
                    "First name is required");
        }

        if (user.getLname() == null
                || user.getLname().isBlank()) {

            throw new RuntimeException(
                    "Last name is required");
        }

        if (user.getEmail() == null
                || user.getEmail().isBlank()) {

            throw new RuntimeException(
                    "Email is required");
        }

        if (user.getPassword() == null
                || user.getPassword().isBlank()) {

            throw new RuntimeException(
                    "Password is required");
        }

        Optional<User> existingUser =
                userRepository.findAll()
                        .stream()
                        .filter(existing ->
                                existing.getEmail() != null
                                        && existing.getEmail()
                                        .equalsIgnoreCase(
                                                user.getEmail()))
                        .findFirst();

        if (existingUser.isPresent()) {
            throw new RuntimeException(
                    "Email is already registered");
        }

        /*
         * Public registration is for students.
         * HR, Department Coordinator and System Admin
         * accounts are managed by the system administrator.
         */
        user.setRole("STUDENT");

        user.setCreatedAt(
                LocalDateTime.now());

        return userRepository.save(user);
    }

    // =========================================================
    // LOGIN
    // =========================================================

    public User login(
            String email,
            String password) {

        if (email == null || email.isBlank()) {
            throw new RuntimeException(
                    "Email is required");
        }

        if (password == null || password.isBlank()) {
            throw new RuntimeException(
                    "Password is required");
        }

        User user =
                userRepository.findAll()
                        .stream()
                        .filter(existing ->
                                existing.getEmail() != null
                                        && existing.getEmail()
                                        .equalsIgnoreCase(email))
                        .findFirst()
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Invalid email or password"));

        /*
         * Authentication is currently simple database
         * authentication. Spring Security/JWT can be added
         * later without changing the ERD.
         */
        if (!user.getPassword().equals(password)) {

            throw new RuntimeException(
                    "Invalid email or password");
        }

        return user;
    }

    // =========================================================
    // GET ALL USERS
    // =========================================================

    public List<User> getAllUsers() {

        return userRepository.findAll();
    }

    // =========================================================
    // GET USER BY ID
    // =========================================================

    public Optional<User> getUserById(
            Integer id) {

        return userRepository.findById(id);
    }

    // =========================================================
    // UPDATE USER
    // =========================================================

    public User updateUser(
            Integer id,
            User user) {

        User existingUser =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"));

        existingUser.setFname(
                user.getFname());

        existingUser.setLname(
                user.getLname());

        existingUser.setEmail(
                user.getEmail());

        existingUser.setPhone(
                user.getPhone());

        /*
         * Password is only changed if a new password
         * is provided.
         */
        if (user.getPassword() != null
                && !user.getPassword().isBlank()) {

            existingUser.setPassword(
                    user.getPassword());
        }

        /*
         * Role is updated only when a role is explicitly
         * supplied. This is useful for System Admin.
         */
        if (user.getRole() != null
                && !user.getRole().isBlank()) {

            existingUser.setRole(
                    user.getRole());
        }

        return userRepository.save(
                existingUser);
    }

    // =========================================================
    // CHANGE USER ROLE
    // =========================================================

    public User changeRole(
            Integer id,
            String role) {

        User user =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"));

        if (role == null || role.isBlank()) {

            throw new RuntimeException(
                    "Role is required");
        }

        String normalizedRole =
                role.toUpperCase();

        if (!normalizedRole.equals("STUDENT")
                && !normalizedRole.equals("HR_OFFICER")
                && !normalizedRole.equals(
                "DEPARTMENT_COORDINATOR")
                && !normalizedRole.equals(
                "SYSTEM_ADMIN")) {

            throw new RuntimeException(
                    "Invalid role");
        }

        user.setRole(normalizedRole);

        return userRepository.save(user);
    }

    // =========================================================
    // DELETE USER
    // =========================================================

    public void deleteUser(
            Integer id) {

        if (!userRepository.existsById(id)) {

            throw new RuntimeException(
                    "User not found");
        }

        userRepository.deleteById(id);
    }
}