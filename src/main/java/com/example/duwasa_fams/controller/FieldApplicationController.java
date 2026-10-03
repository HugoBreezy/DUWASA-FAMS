package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.ApplicationDocument;
import com.example.duwasa_fams.entity.FieldApplication;
import com.example.duwasa_fams.service.FieldApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin
public class FieldApplicationController {

    private final FieldApplicationService fieldApplicationService;

    public FieldApplicationController(
            FieldApplicationService fieldApplicationService) {

        this.fieldApplicationService = fieldApplicationService;
    }

    // =========================================================
    // CREATE APPLICATION
    // =========================================================

    @PostMapping
    public ResponseEntity<FieldApplication> createApplication(
            @RequestBody FieldApplication application) {

        return ResponseEntity.ok(
                fieldApplicationService.createApplication(
                        application)
        );
    }

    // =========================================================
    // GET ALL APPLICATIONS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<FieldApplication>>
    getAllApplications() {

        return ResponseEntity.ok(
                fieldApplicationService.getAllApplications()
        );
    }

    // =========================================================
    // GET APPLICATIONS FOR HR REVIEW
    // =========================================================

    @GetMapping("/hr-review")
    public ResponseEntity<List<FieldApplication>>
    getApplicationsForHRReview() {

        return ResponseEntity.ok(
                fieldApplicationService
                        .getApplicationsForHRReview()
        );
    }

    // =========================================================
    // GET APPLICATIONS FOR STUDENT
    // =========================================================

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<FieldApplication>>
    getApplicationsByStudent(
            @PathVariable Integer studentId) {

        return ResponseEntity.ok(
                fieldApplicationService
                        .getApplicationsByStudent(studentId)
        );
    }

    // =========================================================
    // GET APPLICATION BY ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<FieldApplication>
    getApplicationById(
            @PathVariable Integer id) {

        return fieldApplicationService
                .getApplicationById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // =========================================================
    // UPDATE APPLICATION
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<FieldApplication>
    updateApplication(
            @PathVariable Integer id,
            @RequestBody FieldApplication application) {

        return ResponseEntity.ok(
                fieldApplicationService
                        .updateApplication(
                                id,
                                application)
        );
    }

    // =========================================================
    // VALIDATE APPLICATION
    // =========================================================

    @PostMapping("/{id}/validate")
    public ResponseEntity<FieldApplication>
    validateApplication(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                fieldApplicationService
                        .validateApplication(id)
        );
    }

    // =========================================================
    // SUBMIT APPLICATION
    // =========================================================

    @PostMapping("/{id}/submit")
    public ResponseEntity<FieldApplication>
    submitApplication(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                fieldApplicationService
                        .submitApplication(id)
        );
    }

    // =========================================================
    // VERIFY APPLICATION DOCUMENTS
    // =========================================================

    @GetMapping("/{id}/documents/verify")
    public ResponseEntity<List<ApplicationDocument>>
    verifyApplicationDocuments(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                fieldApplicationService
                        .verifyApplicationDocuments(id)
        );
    }

    // =========================================================
    // CHECK REQUIREMENTS
    // =========================================================

    @PostMapping("/{id}/check-requirements")
    public ResponseEntity<FieldApplication>
    checkRequirements(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                fieldApplicationService
                        .checkRequirements(id)
        );
    }

    // =========================================================
    // CHECK AVAILABLE SLOT
    // =========================================================

    @GetMapping("/{id}/available-slot")
    public ResponseEntity<Integer>
    checkAvailableSlot(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                fieldApplicationService
                        .checkAvailableSlot(id)
        );
    }

    // =========================================================
    // FORWARD TO DEPARTMENT
    // =========================================================

    @PostMapping("/{id}/forward-to-department")
    public ResponseEntity<FieldApplication>
    forwardToDepartment(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                fieldApplicationService
                        .forwardToDepartment(id)
        );
    }

    // =========================================================
    // REJECT BY HR
    // =========================================================

    @PostMapping("/{id}/reject-by-hr")
    public ResponseEntity<FieldApplication>
    rejectByHR(
            @PathVariable Integer id,
            @RequestParam String reason) {

        return ResponseEntity.ok(
                fieldApplicationService
                        .rejectByHR(
                                id,
                                reason)
        );
    }

    // =========================================================
    // CHANGE STATUS
    // =========================================================

    @PatchMapping("/{id}/status")
    public ResponseEntity<FieldApplication>
    changeStatus(
            @PathVariable Integer id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                fieldApplicationService
                        .changeStatus(
                                id,
                                status)
        );
    }

    // =========================================================
    // ADD COMMENT
    // =========================================================

    @PatchMapping("/{id}/comments")
    public ResponseEntity<FieldApplication>
    addComment(
            @PathVariable Integer id,
            @RequestParam String comments) {

        return ResponseEntity.ok(
                fieldApplicationService
                        .addComment(
                                id,
                                comments)
        );
    }

    // =========================================================
    // DELETE APPLICATION
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteApplication(
            @PathVariable Integer id) {

        fieldApplicationService
                .deleteApplication(id);

        return ResponseEntity.noContent().build();
    }
}