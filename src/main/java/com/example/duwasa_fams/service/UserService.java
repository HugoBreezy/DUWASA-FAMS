package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.Student;
import com.example.duwasa_fams.entity.User;
import com.example.duwasa_fams.repository.StudentRepository;
import com.example.duwasa_fams.repository.UserRepository;
import com.example.duwasa_fams.security.JwtService;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public UserService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserDetailsService userDetailsService) {

        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    /*
     * STUDENT REGISTRATION
     *
     * Public registration creates:
     *
     * 1. User record
     * 2. Student record
     *
     * The student profile information such as
     * registration number, college, course and
     * year of study can be completed later.
     */
    @Transactional
    public User registerUser(User user) {

        if (user.getFname() == null
                || user.getFname().isBlank()) {

            throw new RuntimeException(
                    "First name is required"
            );
        }

        if (user.getLname() == null
                || user.getLname().isBlank()) {

            throw new RuntimeException(
                    "Last name is required"
            );
        }

        if (user.getEmail() == null
                || user.getEmail().isBlank()) {

            throw new RuntimeException(
                    "Email is required"
            );
        }

        if (user.getPassword() == null
                || user.getPassword().isBlank()) {

            throw new RuntimeException(
                    "Password is required"
            );
        }

        boolean emailExists =
                userRepository.findAll()
                        .stream()
                        .anyMatch(existing ->
                                existing.getEmail() != null
                                        && existing.getEmail()
                                        .equalsIgnoreCase(
                                                user.getEmail()
                                        )
                        );

        if (emailExists) {

            throw new RuntimeException(
                    "Email is already registered"
            );
        }

        /*
         * Public registration is only for students.
         */
        user.setRole("STUDENT");

        /*
         * Encrypt password before saving.
         */
        user.setPassword(
                passwordEncoder.encode(
                        user.getPassword()
                )
        );

        user.setCreatedAt(
                LocalDateTime.now()
        );

        /*
         * Save USER first because STUDENT
         * contains user_id as a foreign key.
         */
        User savedUser =
                userRepository.save(user);

        /*
         * Create the STUDENT record.
         *
         * Profile fields can be completed later
         * through:
         *
         * PUT /api/students/{id}/profile
         */
        Student student = new Student();

        student.setUser(savedUser);

        studentRepository.save(student);

        return savedUser;
    }

    /*
     * LOGIN
     *
     * Authenticate user and return JWT token.
     */
    public String login(
            String email,
            String password) {

        if (email == null || email.isBlank()) {

            throw new RuntimeException(
                    "Email is required"
            );
        }

        if (password == null || password.isBlank()) {

            throw new RuntimeException(
                    "Password is required"
            );
        }

        /*
         * Authenticate email and password.
         */
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        email,
                        password
                )
        );

        /*
         * Load actual user details from database.
         */
        UserDetails userDetails =
                userDetailsService.loadUserByUsername(
                        email
                );

        /*
         * Generate JWT.
         */
        return jwtService.generateToken(
                userDetails
        );
    }

    /*
     * GET ALL USERS
     */
    public List<User> getAllUsers() {

        return userRepository.findAll();
    }

    /*
     * GET USER BY ID
     */
    public Optional<User> getUserById(
            Integer id) {

        return userRepository.findById(id);
    }

    /*
     * UPDATE USER
     */
    public User updateUser(
            Integer id,
            User user) {

        User existingUser =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        if (user.getFname() != null
                && !user.getFname().isBlank()) {

            existingUser.setFname(
                    user.getFname()
            );
        }

        if (user.getLname() != null
                && !user.getLname().isBlank()) {

            existingUser.setLname(
                    user.getLname()
            );
        }

        if (user.getEmail() != null
                && !user.getEmail().isBlank()
                && !user.getEmail()
                .equalsIgnoreCase(
                        existingUser.getEmail()
                )) {

            boolean emailExists =
                    userRepository.findAll()
                            .stream()
                            .anyMatch(existing ->
                                    existing.getEmail() != null
                                            && existing.getEmail()
                                            .equalsIgnoreCase(
                                                    user.getEmail()
                                            )
                                            && !existing
                                            .getUserId()
                                            .equals(id)
                            );

            if (emailExists) {

                throw new RuntimeException(
                        "Email is already registered"
                );
            }

            existingUser.setEmail(
                    user.getEmail()
            );
        }

        if (user.getPhone() != null) {

            existingUser.setPhone(
                    user.getPhone()
            );
        }

        /*
         * Encrypt a new password.
         */
        if (user.getPassword() != null
                && !user.getPassword().isBlank()) {

            existingUser.setPassword(
                    passwordEncoder.encode(
                            user.getPassword()
                    )
            );
        }

        /*
         * Role is not changed here.
         * Role management belongs to SYSTEM_ADMIN.
         */
        return userRepository.save(
                existingUser
        );
    }

    /*
     * CHANGE USER ROLE
     */
    public User changeRole(
            Integer id,
            String role) {

        User user =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        if (role == null || role.isBlank()) {

            throw new RuntimeException(
                    "Role is required"
            );
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
                    "Invalid role"
            );
        }

        user.setRole(
                normalizedRole
        );

        return userRepository.save(user);
    }

    /*
     * DELETE USER
     */
    public void deleteUser(
            Integer id) {

        if (!userRepository.existsById(id)) {

            throw new RuntimeException(
                    "User not found"
            );
        }

        userRepository.deleteById(id);
    }
}