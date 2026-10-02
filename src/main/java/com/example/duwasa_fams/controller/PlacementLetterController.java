package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.PlacementLetter;
import com.example.duwasa_fams.service.PlacementLetterService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/placement-letters")
@CrossOrigin
public class PlacementLetterController {

    private final PlacementLetterService placementLetterService;

    public PlacementLetterController(
            PlacementLetterService placementLetterService) {

        this.placementLetterService =
                placementLetterService;
    }

    // Get all placement letters
    @GetMapping
    public ResponseEntity<List<PlacementLetter>>
    getAllLetters() {

        return ResponseEntity.ok(
                placementLetterService.getAllLetters()
        );
    }

    // Get placement letter by ID
    @GetMapping("/{id}")
    public ResponseEntity<PlacementLetter>
    getLetterById(
            @PathVariable Integer id) {

        return placementLetterService
                .getLetterById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // Get placement letter by application
    @GetMapping("/application/{applicationId}")
    public ResponseEntity<PlacementLetter>
    getLetterByApplication(
            @PathVariable Integer applicationId) {

        return placementLetterService
                .getLetterByApplication(applicationId)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // Delete placement letter
    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteLetter(
            @PathVariable Integer id) {

        placementLetterService.deleteLetter(id);

        return ResponseEntity.noContent().build();
    }
}