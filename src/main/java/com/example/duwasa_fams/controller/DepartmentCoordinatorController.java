package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.DepartmentCoordinator;
import com.example.duwasa_fams.entity.FieldApplication;
import com.example.duwasa_fams.service.DepartmentCoordinatorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/department-coordinators")
@CrossOrigin
public class DepartmentCoordinatorController {

    private final DepartmentCoordinatorService coordinatorService;

    public DepartmentCoordinatorController(
            DepartmentCoordinatorService coordinatorService) {

        this.coordinatorService = coordinatorService;
    }

    // Get all coordinators
    @GetMapping
    public ResponseEntity<List<DepartmentCoordinator>>
    getAllCoordinators() {

        return ResponseEntity.ok(
                coordinatorService.getAllCoordinators()
        );
    }

    // Get coordinator by ID
    @GetMapping("/{id}")
    public ResponseEntity<DepartmentCoordinator>
    getCoordinatorById(
            @PathVariable Integer id) {

        return coordinatorService
                .getCoordinatorById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // Create coordinator
    @PostMapping
    public ResponseEntity<DepartmentCoordinator>
    createCoordinator(
            @RequestBody DepartmentCoordinator coordinator) {

        return ResponseEntity.ok(
                coordinatorService
                        .saveCoordinator(coordinator)
        );
    }

    // View forwarded applications
    @GetMapping("/{id}/applications")
    public ResponseEntity<List<FieldApplication>>
    getForwardedApplications(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                coordinatorService
                        .getForwardedApplications(id)
        );
    }

    // Check available positions
    @GetMapping("/applications/{applicationId}/available-positions")
    public ResponseEntity<Integer>
    checkAvailablePositions(
            @PathVariable Integer applicationId) {

        return ResponseEntity.ok(
                coordinatorService
                        .checkAvailablePositions(
                                applicationId)
        );
    }

    // Accept application
    @PostMapping("/applications/{applicationId}/accept")
    public ResponseEntity<FieldApplication>
    acceptApplication(
            @PathVariable Integer applicationId) {

        return ResponseEntity.ok(
                coordinatorService
                        .acceptApplication(
                                applicationId)
        );
    }

    // Reject application
    @PostMapping("/applications/{applicationId}/reject")
    public ResponseEntity<FieldApplication>
    rejectApplication(
            @PathVariable Integer applicationId,
            @RequestParam String reason) {

        return ResponseEntity.ok(
                coordinatorService
                        .rejectApplication(
                                applicationId,
                                reason)
        );
    }

    // Delete coordinator
    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteCoordinator(
            @PathVariable Integer id) {

        coordinatorService.deleteCoordinator(id);

        return ResponseEntity.noContent().build();
    }
}