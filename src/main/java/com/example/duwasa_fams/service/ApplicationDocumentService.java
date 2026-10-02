package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.ApplicationDocument;
import com.example.duwasa_fams.entity.FieldApplication;
import com.example.duwasa_fams.repository.ApplicationDocumentRepository;
import com.example.duwasa_fams.repository.FieldApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ApplicationDocumentService {

    private final ApplicationDocumentRepository applicationDocumentRepository;
    private final FieldApplicationRepository fieldApplicationRepository;

    private static final long MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

    public ApplicationDocumentService(
            ApplicationDocumentRepository applicationDocumentRepository,
            FieldApplicationRepository fieldApplicationRepository) {

        this.applicationDocumentRepository = applicationDocumentRepository;
        this.fieldApplicationRepository = fieldApplicationRepository;
    }

    // Get all documents
    public List<ApplicationDocument> getAllDocuments() {
        return applicationDocumentRepository.findAll();
    }

    // Get document by ID
    public Optional<ApplicationDocument> getDocumentById(Integer id) {
        return applicationDocumentRepository.findById(id);
    }

    // Upload document
    public ApplicationDocument uploadDocument(
            Integer applicationId,
            String documentType,
            MultipartFile file) {

        // Check if file was selected
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Please select a document");
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException(
                    "File size must not exceed 1 MB"
            );
        }

        // Get original file name
        String originalFileName = file.getOriginalFilename();

        if (originalFileName == null || originalFileName.isBlank()) {
            throw new RuntimeException("Invalid file name");
        }

        // Check file type
        String fileName = originalFileName.toLowerCase();

        if (!fileName.endsWith(".pdf")
                && !fileName.endsWith(".jpg")
                && !fileName.endsWith(".jpeg")
                && !fileName.endsWith(".png")) {

            throw new RuntimeException(
                    "Invalid file type. Only PDF, JPG, JPEG and PNG are allowed"
            );
        }

        // Check if application exists
        FieldApplication application =
                fieldApplicationRepository.findById(applicationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"
                                )
                        );

        // Create document record
        ApplicationDocument document =
                new ApplicationDocument();

        document.setApplication(application);
        document.setDocumentType(documentType);
        document.setFileName(originalFileName);
        document.setUploadDate(LocalDateTime.now());
        document.setVerificationStatus("PENDING");

        /*
         * Actual file storage will be added next.
         * For now, the system validates the file
         * and saves its database record.
         */

        return applicationDocumentRepository.save(document);
    }

    // Verify document
    public ApplicationDocument verifyDocument(
            Integer id,
            String verificationStatus) {

        ApplicationDocument document =
                applicationDocumentRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"
                                )
                        );

        document.setVerificationStatus(verificationStatus);

        return applicationDocumentRepository.save(document);
    }

    // Delete document
    public void deleteDocument(Integer id) {
        applicationDocumentRepository.deleteById(id);
    }
}