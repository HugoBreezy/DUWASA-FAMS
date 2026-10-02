package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.Department;
import com.example.duwasa_fams.entity.DepartmentCoordinator;
import com.example.duwasa_fams.entity.User;
import com.example.duwasa_fams.repository.DepartmentCoordinatorRepository;
import com.example.duwasa_fams.repository.DepartmentRepository;
import com.example.duwasa_fams.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SystemAdminService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final DepartmentCoordinatorRepository coordinatorRepository;

    public SystemAdminService(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            DepartmentCoordinatorRepository coordinatorRepository) {

        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.coordinatorRepository = coordinatorRepository;
    }

    // =========================================================
    // CREATE HR OFFICER
    // =========================================================

    public User createHROfficer(User user) {

        validateUserDetails(user);

        checkEmailExists(user.getEmail());

        user.setRole("HR_OFFICER");
        user.setCreatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    // =========================================================
    // CREATE DEPARTMENT
    // =========================================================

    public Department createDepartment(
            Department department) {

        if (department.getDepartmentName() == null
                || department.getDepartmentName().isBlank()) {

            throw new RuntimeException(
                    "Department name is required");
        }

        boolean exists =
                departmentRepository.findAll()
                        .stream()
                        .anyMatch(existing ->
                                existing.getDepartmentName()
                                        .equalsIgnoreCase(
                                                department.getDepartmentName()));

        if (exists) {
            throw new RuntimeException(
                    "Department already exists");
        }

        if (department.getTotalSlots() == null
                || department.getTotalSlots() < 0) {

            throw new RuntimeException(
                    "Total slots must be zero or greater");
        }

        department.setOccupiedSlots(0);

        if (department.getStatus() == null
                || department.getStatus().isBlank()) {

            department.setStatus("ACTIVE");
        }

        return departmentRepository.save(department);
    }

    // =========================================================
    // CREATE DEPARTMENT COORDINATOR
    // =========================================================

    public DepartmentCoordinator createDepartmentCoordinator(
            User user,
            Integer departmentId) {

        validateUserDetails(user);

        checkEmailExists(user.getEmail());

        Department department =
                departmentRepository.findById(departmentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Department not found"));

        boolean departmentAlreadyAssigned =
                coordinatorRepository.findAll()
                        .stream()
                        .anyMatch(coordinator ->
                                coordinator.getDepartment() != null
                                        && coordinator.getDepartment()
                                        .getDepartmentId()
                                        .equals(departmentId));

        if (departmentAlreadyAssigned) {
            throw new RuntimeException(
                    "This department already has a coordinator");
        }

        user.setRole("DEPARTMENT_COORDINATOR");
        user.setCreatedAt(LocalDateTime.now());

        User savedUser =
                userRepository.save(user);

        DepartmentCoordinator coordinator =
                new DepartmentCoordinator();

        coordinator.setUser(savedUser);
        coordinator.setDepartment(department);

        return coordinatorRepository.save(
                coordinator);
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
    // GET HR OFFICERS
    // =========================================================

    public List<User> getHROfficers() {

        return userRepository.findAll()
                .stream()
                .filter(user ->
                        "HR_OFFICER".equalsIgnoreCase(
                                user.getRole()))
                .toList();
    }

    // =========================================================
    // GET DEPARTMENT COORDINATORS
    // =========================================================

    public List<DepartmentCoordinator>
    getDepartmentCoordinators() {

        return coordinatorRepository.findAll();
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

        boolean emailUsedByAnotherUser =
                userRepository.findAll()
                        .stream()
                        .anyMatch(existing ->
                                !existing.getUserId()
                                        .equals(id)
                                        && existing.getEmail() != null
                                        && existing.getEmail()
                                        .equalsIgnoreCase(
                                                user.getEmail()));

        if (emailUsedByAnotherUser) {
            throw new RuntimeException(
                    "Email is already registered by another user");
        }

        existingUser.setFname(
                user.getFname());

        existingUser.setLname(
                user.getLname());

        existingUser.setEmail(
                user.getEmail());

        existingUser.setPhone(
                user.getPhone());

        if (user.getPassword() != null
                && !user.getPassword().isBlank()) {

            existingUser.setPassword(
                    user.getPassword());
        }

        return userRepository.save(
                existingUser);
    }

    // =========================================================
    // CHANGE USER ROLE
    // =========================================================

    public User changeUserRole(
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

    // =========================================================
    // VALIDATE USER DETAILS
    // =========================================================

    private void validateUserDetails(
            User user) {

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
    }

    // =========================================================
    // CHECK EMAIL
    // =========================================================

    private void checkEmailExists(
            String email) {

        boolean exists =
                userRepository.findAll()
                        .stream()
                        .anyMatch(user ->
                                user.getEmail() != null
                                        && user.getEmail()
                                        .equalsIgnoreCase(
                                                email));

        if (exists) {

            throw new RuntimeException(
                    "Email is already registered");
        }
    }
}