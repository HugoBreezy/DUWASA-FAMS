package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.ApplicationDocument;
import com.example.duwasa_fams.service.ApplicationDocumentService;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/application-documents")
@CrossOrigin
public class ApplicationDocumentController {

    private final ApplicationDocumentService applicationDocumentService;

    public ApplicationDocumentController(
            ApplicationDocumentService applicationDocumentService) {

        this.applicationDocumentService =
                applicationDocumentService;
    }

    // Get all documents
    @GetMapping
    public ResponseEntity<List<ApplicationDocument>>
    getAllDocuments(
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(
                applicationDocumentService.getDocumentsVisibleTo(
                        user.getUsername(),
                        authorities(user)
                )
        );
    }

    // Get document by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApplicationDocument>
    getDocumentById(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails user) {

        return applicationDocumentService
                .getDocumentVisibleTo(id, user.getUsername(), authorities(user))
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // Upload document
    @PostMapping("/upload")
    public ResponseEntity<ApplicationDocument>
    uploadDocument(
            @RequestParam Integer applicationId,
            @RequestParam String documentType,
            @RequestParam MultipartFile file,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(
                applicationDocumentService.uploadDocument(
                        applicationId,
                        documentType,
                        file,
                        user.getUsername()
                )
        );
    }

    // View document in browser
    @GetMapping("/{id}/view")
    public ResponseEntity<Resource>
    viewDocument(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails user) {

        ApplicationDocument document =
                applicationDocumentService
                        .getDocumentVisibleTo(
                                id,
                                user.getUsername(),
                                authorities(user)
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"
                                )
                        );

        if (document.getFilePath() == null
                || document.getFilePath().isBlank()) {

            return ResponseEntity.notFound().build();
        }

        try {

            Path filePath =
                    Paths.get(
                            document.getFilePath()
                    );

            Resource resource =
                    new UrlResource(
                            filePath
                                    .toUri()
                    );

            if (!resource.exists()
                    || !resource.isReadable()) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            MediaType mediaType =
                    MediaType.APPLICATION_OCTET_STREAM;

            String fileName =
                    document.getFileName();

            if (fileName != null) {

                String lower =
                        fileName.toLowerCase();

                if (lower.endsWith(".pdf")) {

                    mediaType =
                            MediaType.APPLICATION_PDF;

                } else if (lower.endsWith(".jpg")
                        || lower.endsWith(".jpeg")) {

                    mediaType =
                            MediaType.IMAGE_JPEG;

                } else if (lower.endsWith(".png")) {

                    mediaType =
                            MediaType.IMAGE_PNG;
                }
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" +
                                    fileName +
                                    "\""
                    )
                    .body(resource);

        } catch (MalformedURLException e) {

            throw new RuntimeException(
                    "Invalid document file path",
                    e
            );
        }
    }

    // Download document
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource>
    downloadDocument(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails user) {

        ApplicationDocument document =
                applicationDocumentService
                        .getDocumentVisibleTo(
                                id,
                                user.getUsername(),
                                authorities(user)
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"
                                )
                        );

        if (document.getFilePath() == null
                || document.getFilePath().isBlank()) {

            return ResponseEntity.notFound().build();
        }

        try {

            Path filePath =
                    Paths.get(
                            document.getFilePath()
                    );

            Resource resource =
                    new UrlResource(
                            filePath.toUri()
                    );

            if (!resource.exists()
                    || !resource.isReadable()) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            return ResponseEntity.ok()
                    .contentType(
                            MediaType.APPLICATION_OCTET_STREAM
                    )
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" +
                                    document.getFileName() +
                                    "\""
                    )
                    .body(resource);

        } catch (MalformedURLException e) {

            throw new RuntimeException(
                    "Invalid document file path",
                    e
            );
        }
    }

    // Verify document
    @PatchMapping("/{id}/verify")
    public ResponseEntity<ApplicationDocument>
    verifyDocument(
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
    public ResponseEntity<Void>
    deleteDocument(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails user) {

        ApplicationDocument document =
                applicationDocumentService
                        .getDocumentVisibleTo(
                                id,
                                user.getUsername(),
                                authorities(user)
                        )
                        .orElseThrow(() ->
                                new RuntimeException("Document not found")
                        );

        if (document.getApplication() == null
                || document.getApplication().getStudent() == null
                || document.getApplication().getStudent().getUser() == null
                || document.getApplication().getStudent().getUser().getEmail() == null
                || !document.getApplication().getStudent().getUser()
                        .getEmail().equalsIgnoreCase(user.getUsername())
                || !"DRAFT".equalsIgnoreCase(
                        document.getApplication().getStatus())) {
            return ResponseEntity.status(403).build();
        }

        applicationDocumentService.deleteDocument(id);

        return ResponseEntity.noContent().build();
    }

    private List<String> authorities(UserDetails user) {
        return user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
    }
}
