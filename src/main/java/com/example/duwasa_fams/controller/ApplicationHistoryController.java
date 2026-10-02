package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.ApplicationHistory;
import com.example.duwasa_fams.service.ApplicationHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/application-history")
@CrossOrigin
public class ApplicationHistoryController {

    private final ApplicationHistoryService historyService;

    public ApplicationHistoryController(
            ApplicationHistoryService historyService) {

        this.historyService = historyService;
    }

    @GetMapping
    public ResponseEntity<List<ApplicationHistory>>
    getAllHistory() {

        return ResponseEntity.ok(
                historyService.getAllHistory()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationHistory>
    getHistoryById(
            @PathVariable Integer id) {

        return historyService
                .getHistoryById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<List<ApplicationHistory>>
    getApplicationHistory(
            @PathVariable Integer applicationId) {

        return ResponseEntity.ok(
                historyService.getApplicationHistory(
                        applicationId)
        );
    }

    @PostMapping
    public ResponseEntity<ApplicationHistory>
    createHistory(
            @RequestBody ApplicationHistory history) {

        return ResponseEntity.ok(
                historyService.save(history)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteHistory(
            @PathVariable Integer id) {

        historyService.deleteHistory(id);

        return ResponseEntity.noContent().build();
    }
}