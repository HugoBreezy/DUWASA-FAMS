package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.ApplicationDocument;
import com.example.duwasa_fams.entity.FieldApplication;
import com.example.duwasa_fams.repository.ApplicationDocumentRepository;
import com.example.duwasa_fams.repository.DepartmentCoordinatorRepository;
import com.example.duwasa_fams.repository.FieldApplicationRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Collection;

@Service
public class ApplicationDocumentService {

    private final ApplicationDocumentRepository applicationDocumentRepository;
    private final FieldApplicationRepository fieldApplicationRepository;
    private final DepartmentCoordinatorRepository departmentCoordinatorRepository;

    private static final long MAX_FILE_SIZE =
            1 * 1024 * 1024; // 1 MB

    private static final String UPLOAD_DIR =
            "uploads/application-documents/";

    public ApplicationDocumentService(
            ApplicationDocumentRepository applicationDocumentRepository,
            FieldApplicationRepository fieldApplicationRepository,
            DepartmentCoordinatorRepository departmentCoordinatorRepository) {

        this.applicationDocumentRepository =
                applicationDocumentRepository;

        this.fieldApplicationRepository =
                fieldApplicationRepository;

        this.departmentCoordinatorRepository =
                departmentCoordinatorRepository;
    }

    // Get all documents
    public List<ApplicationDocument> getAllDocuments() {

        return applicationDocumentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ApplicationDocument> getDocumentsVisibleTo(
            String email,
            Collection<String> authorities) {

        return applicationDocumentRepository.findAll()
                .stream()
                .filter(document -> canViewDocument(
                        document,
                        email,
                        authorities
                ))
                .toList();
    }

    // Get document by ID
    public Optional<ApplicationDocument> getDocumentById(
            Integer id) {

        return applicationDocumentRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<ApplicationDocument> getDocumentVisibleTo(
            Integer id,
            String email,
            Collection<String> authorities) {

        return getDocumentById(id)
                .filter(document -> canViewDocument(
                        document,
                        email,
                        authorities
                ));
    }

    // Upload document
    @Transactional
    public ApplicationDocument uploadDocument(
            Integer applicationId,
            String documentType,
            MultipartFile file,
            String email) {

        // Check if file was selected
        if (file == null || file.isEmpty()) {

            throw new RuntimeException(
                    "Please select a document"
            );
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {

            throw new RuntimeException(
                    "File size must not exceed 1 MB"
            );
        }

        // Get original file name
        String originalFileName =
                file.getOriginalFilename();

        if (originalFileName == null
                || originalFileName.isBlank()) {

            throw new RuntimeException(
                    "Invalid file name"
            );
        }

        // Check file type
        String fileName =
                originalFileName.toLowerCase();

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
                fieldApplicationRepository
                        .findById(applicationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"
                                )
                        );

        if (!ownsApplication(application, email)
                || !"DRAFT".equalsIgnoreCase(application.getStatus())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only the owner can upload documents to a draft application"
            );
        }

        try {

            // Create upload directory
            Path uploadPath =
                    Paths.get(System.getProperty("user.dir"))
                            .resolve(UPLOAD_DIR)
                            .toAbsolutePath()
                            .normalize();

            Files.createDirectories(uploadPath);

            /*
             * Generate a unique storage name.
             *
             * We keep the original file name in the database
             * for display to the HR officer/student.
             *
             * The actual physical file gets a unique name
             * to prevent two documents with the same name
             * from overwriting each other.
             */
            String storedFileName =
                    UUID.randomUUID()
                            + "_"
                            + originalFileName;

            Path targetPath =
                    uploadPath.resolve(storedFileName)
                            .toAbsolutePath()
                            .normalize();

            // Save the actual uploaded file
            file.transferTo(targetPath.toFile());

            // Create document database record
            ApplicationDocument document =
                    new ApplicationDocument();

            document.setApplication(application);

            document.setDocumentType(
                    documentType
            );

            document.setFileName(
                    originalFileName
            );

            document.setFilePath(
                    targetPath
                            .toAbsolutePath()
                            .toString()
            );

            document.setUploadDate(
                    LocalDateTime.now()
            );

            document.setVerificationStatus(
                    "PENDING"
            );

            return applicationDocumentRepository.save(
                    document
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to save uploaded document",
                    e
            );
        }
    }

    // Verify document
    public ApplicationDocument verifyDocument(
            Integer id,
            String verificationStatus) {

        ApplicationDocument document =
                applicationDocumentRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"
                                )
                        );

        document.setVerificationStatus(
                verificationStatus
        );

        return applicationDocumentRepository.save(
                document
        );
    }

    // Delete document
    public void deleteDocument(Integer id) {

        ApplicationDocument document =
                applicationDocumentRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"
                                )
                        );

        // Delete physical file if it exists
        if (document.getFilePath() != null
                && !document.getFilePath().isBlank()) {

            try {

                Path filePath =
                        Paths.get(
                                document.getFilePath()
                        );

                Files.deleteIfExists(filePath);

            } catch (IOException e) {

                throw new RuntimeException(
                        "Failed to delete document file",
                        e
                );
            }
        }

        // Delete database record
        applicationDocumentRepository.delete(
                document
        );
    }

    private boolean canViewDocument(
            ApplicationDocument document,
            String email,
            Collection<String> authorities) {

        FieldApplication application = document.getApplication();
        if (application == null) {
            return false;
        }

        if (ownsApplication(application, email)) {
            return true;
        }

        if (authorities.contains("ROLE_HR_OFFICER")) {
            return application.getStatus() != null
                    && !"DRAFT".equalsIgnoreCase(application.getStatus());
        }

        if (authorities.contains("ROLE_DEPARTMENT_COORDINATOR")
                && "PENDING_DEPARTMENT_REVIEW".equalsIgnoreCase(
                        application.getStatus())) {
            return departmentCoordinatorRepository.findAll()
                    .stream()
                    .anyMatch(coordinator ->
                            coordinator.getUser() != null
                                    && coordinator.getUser().getEmail() != null
                                    && coordinator.getUser().getEmail()
                                            .equalsIgnoreCase(email)
                                    && coordinator.getDepartment() != null
                                    && application.getDepartment() != null
                                    && coordinator.getDepartment().getDepartmentId()
                                            .equals(application.getDepartment().getDepartmentId())
                    );
        }

        return false;
    }

    private boolean ownsApplication(
            FieldApplication application,
            String email) {

        return email != null
                && application.getStudent() != null
                && application.getStudent().getUser() != null
                && application.getStudent().getUser().getEmail() != null
                && application.getStudent().getUser().getEmail()
                        .equalsIgnoreCase(email);
    }
}
