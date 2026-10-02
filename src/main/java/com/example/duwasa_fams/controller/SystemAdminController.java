package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.Department;
import com.example.duwasa_fams.entity.DepartmentCoordinator;
import com.example.duwasa_fams.entity.User;
import com.example.duwasa_fams.service.DepartmentService;
import com.example.duwasa_fams.service.SystemAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class SystemAdminController {

    private final SystemAdminService systemAdminService;
    private final DepartmentService departmentService;

    public SystemAdminController(
            SystemAdminService systemAdminService,
            DepartmentService departmentService) {

        this.systemAdminService = systemAdminService;
        this.departmentService = departmentService;
    }

    // =========================================================
    // USER MANAGEMENT
    // =========================================================

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {

        return ResponseEntity.ok(
                systemAdminService.getAllUsers()
        );
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(
            @PathVariable Integer id) {

        return systemAdminService
                .getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Integer id,
            @RequestBody User user) {

        return ResponseEntity.ok(
                systemAdminService.updateUser(
                        id,
                        user)
        );
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<User> changeUserRole(
            @PathVariable Integer id,
            @RequestParam String role) {

        return ResponseEntity.ok(
                systemAdminService.changeUserRole(
                        id,
                        role)
        );
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Integer id) {

        systemAdminService.deleteUser(id);

        return ResponseEntity.noContent().build();
    }

    // =========================================================
    // HR OFFICER MANAGEMENT
    // =========================================================

    @PostMapping("/hr-officers")
    public ResponseEntity<User> createHROfficer(
            @RequestBody User user) {

        return ResponseEntity.ok(
                systemAdminService.createHROfficer(user)
        );
    }

    @GetMapping("/hr-officers")
    public ResponseEntity<List<User>> getHROfficers() {

        return ResponseEntity.ok(
                systemAdminService.getHROfficers()
        );
    }

    // =========================================================
    // DEPARTMENT MANAGEMENT
    // =========================================================

    @PostMapping("/departments")
    public ResponseEntity<Department>
    createDepartment(
            @RequestBody Department department) {

        return ResponseEntity.ok(
                systemAdminService.createDepartment(
                        department)
        );
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Department>>
    getAllDepartments() {

        return ResponseEntity.ok(
                departmentService.getAllDepartments()
        );
    }

    @GetMapping("/departments/{id}")
    public ResponseEntity<Department>
    getDepartmentById(
            @PathVariable Integer id) {

        return departmentService
                .getDepartmentById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<Department>
    updateDepartment(
            @PathVariable Integer id,
            @RequestBody Department department) {

        return ResponseEntity.ok(
                departmentService.updateDepartment(
                        id,
                        department)
        );
    }

    @PatchMapping("/departments/{id}/status")
    public ResponseEntity<Department>
    changeDepartmentStatus(
            @PathVariable Integer id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                departmentService.changeDepartmentStatus(
                        id,
                        status)
        );
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Void>
    deleteDepartment(
            @PathVariable Integer id) {

        departmentService.deleteDepartment(id);

        return ResponseEntity.noContent().build();
    }

    // =========================================================
    // DEPARTMENT COORDINATOR MANAGEMENT
    // =========================================================

    @PostMapping("/department-coordinators")
    public ResponseEntity<DepartmentCoordinator>
    createDepartmentCoordinator(
            @RequestParam Integer departmentId,
            @RequestBody User user) {

        return ResponseEntity.ok(
                systemAdminService
                        .createDepartmentCoordinator(
                                user,
                                departmentId)
        );
    }

    @GetMapping("/department-coordinators")
    public ResponseEntity<List<DepartmentCoordinator>>
    getDepartmentCoordinators() {

        return ResponseEntity.ok(
                systemAdminService
                        .getDepartmentCoordinators()
        );
    }
}