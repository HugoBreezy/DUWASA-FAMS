package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.PlacementLetter;
import com.example.duwasa_fams.service.PlacementLetterService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/placement-letters")
@CrossOrigin
public class PlacementLetterController {

    private final PlacementLetterService placementLetterService;

    public PlacementLetterController(
            PlacementLetterService placementLetterService) {

        this.placementLetterService = placementLetterService;
    }

    /**
     * Generate and save placement letter.
     *
     * This endpoint saves the placement letter,
     * generates its PDF and stores the PDF path.
     */
    @PostMapping("/generate")
    public ResponseEntity<PlacementLetter> generateLetter(
            @RequestBody PlacementLetter letter) {

        PlacementLetter generatedLetter =
                placementLetterService.save(letter);

        return ResponseEntity.ok(generatedLetter);
    }

    /**
     * Get all placement letters.
     */
    @GetMapping
    public ResponseEntity<List<PlacementLetter>> getAllLetters() {

        return ResponseEntity.ok(
                placementLetterService.getAllLetters()
        );
    }

    /**
     * Get placement letter by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PlacementLetter> getLetterById(
            @PathVariable Integer id) {

        return placementLetterService
                .getLetterById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    /**
     * Get placement letter by application.
     */
    @GetMapping("/application/{applicationId}")
    public ResponseEntity<PlacementLetter> getLetterByApplication(
            @PathVariable Integer applicationId) {

        return placementLetterService
                .getLetterByApplication(applicationId)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    /**
     * View placement letter PDF in browser.
     */
    @GetMapping("/{id}/view")
    public ResponseEntity<Resource> viewLetter(
            @PathVariable Integer id) {

        return placementLetterService
                .getLetterById(id)
                .map(letter -> {

                    try {

                        if (letter.getFilePath() == null ||
                                letter.getFilePath().isBlank()) {

                            return ResponseEntity
                                    .notFound()
                                    .<Resource>build();
                        }

                        Path path = Paths.get(
                                letter.getFilePath()
                        );

                        Resource resource =
                                new UrlResource(
                                        path.toUri()
                                );

                        if (!resource.exists() ||
                                !resource.isReadable()) {

                            return ResponseEntity
                                    .notFound()
                                    .<Resource>build();
                        }

                        return ResponseEntity.ok()
                                .contentType(
                                        MediaType.APPLICATION_PDF
                                )
                                .header(
                                        HttpHeaders.CONTENT_DISPOSITION,
                                        "inline; filename=\"" +
                                                letter.getFileName() +
                                                "\""
                                )
                                .body(resource);

                    } catch (MalformedURLException e) {

                        return ResponseEntity
                                .badRequest()
                                .<Resource>build();
                    }
                })
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    /**
     * Download placement letter PDF.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadLetter(
            @PathVariable Integer id) {

        return placementLetterService
                .getLetterById(id)
                .map(letter -> {

                    try {

                        if (letter.getFilePath() == null ||
                                letter.getFilePath().isBlank()) {

                            return ResponseEntity
                                    .notFound()
                                    .<Resource>build();
                        }

                        Path path = Paths.get(
                                letter.getFilePath()
                        );

                        Resource resource =
                                new UrlResource(
                                        path.toUri()
                                );

                        if (!resource.exists() ||
                                !resource.isReadable()) {

                            return ResponseEntity
                                    .notFound()
                                    .<Resource>build();
                        }

                        return ResponseEntity.ok()
                                .contentType(
                                        MediaType.APPLICATION_PDF
                                )
                                .header(
                                        HttpHeaders.CONTENT_DISPOSITION,
                                        "attachment; filename=\"" +
                                                letter.getFileName() +
                                                "\""
                                )
                                .body(resource);

                    } catch (MalformedURLException e) {

                        return ResponseEntity
                                .badRequest()
                                .<Resource>build();
                    }
                })
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    /**
     * Delete placement letter.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLetter(
            @PathVariable Integer id) {

        placementLetterService.deleteLetter(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}