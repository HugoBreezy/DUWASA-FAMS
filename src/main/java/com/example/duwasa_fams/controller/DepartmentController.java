package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.Department;
import com.example.duwasa_fams.service.DepartmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(
            DepartmentService departmentService) {

        this.departmentService = departmentService;
    }

    // =========================================================
    // CREATE DEPARTMENT
    // =========================================================

    @PostMapping
    public ResponseEntity<Department>
    createDepartment(
            @RequestBody Department department) {

        return ResponseEntity.ok(
                departmentService.createDepartment(
                        department)
        );
    }

    // =========================================================
    // GET ALL DEPARTMENTS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<Department>>
    getAllDepartments() {

        return ResponseEntity.ok(
                departmentService.getAllDepartments()
        );
    }

    // =========================================================
    // GET DEPARTMENT BY ID
    // =========================================================

    @GetMapping("/{id}")
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

    // =========================================================
    // UPDATE DEPARTMENT
    // =========================================================

    @PutMapping("/{id}")
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

    // =========================================================
    // CHANGE DEPARTMENT STATUS
    // =========================================================

    @PatchMapping("/{id}/status")
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

    // =========================================================
    // DELETE DEPARTMENT
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteDepartment(
            @PathVariable Integer id) {

        departmentService.deleteDepartment(id);

        return ResponseEntity.noContent().build();
    }
}