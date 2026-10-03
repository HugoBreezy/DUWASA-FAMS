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

    // =========================================================
    // GENERATE AND SAVE PLACEMENT LETTER
    // =========================================================

    @PostMapping("/generate")
    public ResponseEntity<PlacementLetter> generateLetter(
            @RequestBody PlacementLetter letter) {

        PlacementLetter generatedLetter =
                placementLetterService.save(letter);

        return ResponseEntity.ok(generatedLetter);
    }

    // =========================================================
    // GET ALL PLACEMENT LETTERS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<PlacementLetter>> getAllLetters() {

        return ResponseEntity.ok(
                placementLetterService.getAllLetters()
        );
    }

    // =========================================================
    // GET PLACEMENT LETTER BY ID
    // =========================================================

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

    // =========================================================
    // GET PLACEMENT LETTER BY APPLICATION
    // =========================================================

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

    // =========================================================
    // VIEW PLACEMENT LETTER BY LETTER ID
    // =========================================================

    @GetMapping("/{id}/view")
    public ResponseEntity<Resource> viewLetter(
            @PathVariable Integer id) {

        return placementLetterService
                .getLetterById(id)
                .map(this::viewPdf)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // =========================================================
    // DOWNLOAD PLACEMENT LETTER BY LETTER ID
    // =========================================================

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadLetter(
            @PathVariable Integer id) {

        return placementLetterService
                .getLetterById(id)
                .map(this::downloadPdf)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // =========================================================
    // VIEW PLACEMENT LETTER BY APPLICATION ID
    // =========================================================

    @GetMapping("/application/{applicationId}/view")
    public ResponseEntity<Resource> viewLetterByApplication(
            @PathVariable Integer applicationId) {

        return placementLetterService
                .getLetterByApplication(applicationId)
                .map(this::viewPdf)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // =========================================================
    // DOWNLOAD PLACEMENT LETTER BY APPLICATION ID
    // =========================================================

    @GetMapping("/application/{applicationId}/download")
    public ResponseEntity<Resource> downloadLetterByApplication(
            @PathVariable Integer applicationId) {

        return placementLetterService
                .getLetterByApplication(applicationId)
                .map(this::downloadPdf)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // =========================================================
    // VIEW PDF
    // =========================================================

    private ResponseEntity<Resource> viewPdf(
            PlacementLetter letter) {

        try {

            if (letter.getFilePath() == null
                    || letter.getFilePath().isBlank()) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            Path path = Paths.get(
                    letter.getFilePath()
            );

            Resource resource =
                    new UrlResource(
                            path.toUri()
                    );

            if (!resource.exists()
                    || !resource.isReadable()) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            return ResponseEntity.ok()
                    .contentType(
                            MediaType.APPLICATION_PDF
                    )
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\""
                                    + letter.getFileName()
                                    + "\""
                    )
                    .body(resource);

        } catch (MalformedURLException e) {

            return ResponseEntity
                    .badRequest()
                    .build();
        }
    }

    // =========================================================
    // DOWNLOAD PDF
    // =========================================================

    private ResponseEntity<Resource> downloadPdf(
            PlacementLetter letter) {

        try {

            if (letter.getFilePath() == null
                    || letter.getFilePath().isBlank()) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            Path path = Paths.get(
                    letter.getFilePath()
            );

            Resource resource =
                    new UrlResource(
                            path.toUri()
                    );

            if (!resource.exists()
                    || !resource.isReadable()) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            return ResponseEntity.ok()
                    .contentType(
                            MediaType.APPLICATION_PDF
                    )
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\""
                                    + letter.getFileName()
                                    + "\""
                    )
                    .body(resource);

        } catch (MalformedURLException e) {

            return ResponseEntity
                    .badRequest()
                    .build();
        }
    }

    // =========================================================
    // DELETE PLACEMENT LETTER
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLetter(
            @PathVariable Integer id) {

        placementLetterService.deleteLetter(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}