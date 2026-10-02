package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.ApplicationDocument;
import com.example.duwasa_fams.service.ApplicationDocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/application-documents")
@CrossOrigin
public class ApplicationDocumentController {

    private final ApplicationDocumentService applicationDocumentService;

    public ApplicationDocumentController(
            ApplicationDocumentService applicationDocumentService) {

        this.applicationDocumentService = applicationDocumentService;
    }

    // Get all documents
    @GetMapping
    public ResponseEntity<List<ApplicationDocument>> getAllDocuments() {

        return ResponseEntity.ok(
                applicationDocumentService.getAllDocuments()
        );
    }

    // Get document by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApplicationDocument> getDocumentById(
            @PathVariable Integer id) {

        return applicationDocumentService.getDocumentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Upload document
    @PostMapping("/upload")
    public ResponseEntity<ApplicationDocument> uploadDocument(
            @RequestParam Integer applicationId,
            @RequestParam String documentType,
            @RequestParam MultipartFile file) {

        return ResponseEntity.ok(
                applicationDocumentService.uploadDocument(
                        applicationId,
                        documentType,
                        file
                )
        );
    }

    // Verify document
    @PatchMapping("/{id}/verify")
    public ResponseEntity<ApplicationDocument> verifyDocument(
            @PathVariable Integer id,
            @RequestParam String verificationStatus) {

        return ResponseEntity.ok(
                applicationDocumentService.verifyDocument(
                        id,
                        verificationStatus
                )
        );
    }

    // Delete document
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Integer id) {

        applicationDocumentService.deleteDocument(id);

        return ResponseEntity.noContent().build();
    }
}