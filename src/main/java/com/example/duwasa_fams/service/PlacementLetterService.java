package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.FieldApplication;
import com.example.duwasa_fams.entity.PlacementLetter;
import com.example.duwasa_fams.repository.FieldApplicationRepository;
import com.example.duwasa_fams.repository.PlacementLetterRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PlacementLetterService {

    private final PlacementLetterRepository placementLetterRepository;
    private final FieldApplicationRepository fieldApplicationRepository;
    private final PlacementLetterPdfService placementLetterPdfService;

    public PlacementLetterService(
            PlacementLetterRepository placementLetterRepository,
            FieldApplicationRepository fieldApplicationRepository,
            PlacementLetterPdfService placementLetterPdfService) {

        this.placementLetterRepository = placementLetterRepository;
        this.fieldApplicationRepository = fieldApplicationRepository;
        this.placementLetterPdfService = placementLetterPdfService;
    }

    /**
     * Save placement letter and generate its PDF.
     */
    public PlacementLetter save(PlacementLetter letter) {

        if (letter == null) {
            throw new RuntimeException(
                    "Placement letter cannot be null"
            );
        }

        if (letter.getApplication() == null
                || letter.getApplication().getApplicationId() == null) {

            throw new RuntimeException(
                    "Placement letter must have an application"
            );
        }

        /*
         * Load the complete application from the database.
         * This prevents generating a PDF with only applicationId
         * while student, department and dates remain null.
         */
        Integer applicationId =
                letter.getApplication().getApplicationId();

        FieldApplication application =
                fieldApplicationRepository.findById(applicationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"
                                )
                        );

        /*
         * Use the complete application loaded from the database.
         */
        letter.setApplication(application);

        /*
         * Set issue date automatically if not provided.
         */
        if (letter.getIssueDate() == null) {
            letter.setIssueDate(LocalDate.now());
        }

        /*
         * Generate letter number if it was not provided.
         */
        if (letter.getLetterNumber() == null
                || letter.getLetterNumber().isBlank()) {

            letter.setLetterNumber(
                    "DUWASA-FL-" + applicationId
            );
        }

        /*
         * Generate file name if it was not provided.
         */
        if (letter.getFileName() == null
                || letter.getFileName().isBlank()) {

            letter.setFileName(
                    "placement-letter-"
                            + applicationId
                            + ".pdf"
            );
        }

        /*
         * Save first so that the placement letter gets its ID.
         */
        PlacementLetter savedLetter =
                placementLetterRepository.save(letter);

        /*
         * Generate the actual PDF file.
         */
        String filePath =
                placementLetterPdfService
                        .generatePlacementLetter(savedLetter);

        /*
         * Store PDF path in the database.
         */
        savedLetter.setFilePath(filePath);

        savedLetter =
                placementLetterRepository.save(savedLetter);

        return savedLetter;
    }

    /**
     * Get all placement letters.
     */
    public List<PlacementLetter> getAllLetters() {

        return placementLetterRepository.findAll();
    }

    /**
     * Get placement letter by ID.
     */
    public Optional<PlacementLetter> getLetterById(
            Integer id) {

        return placementLetterRepository.findById(id);
    }

    /**
     * Get placement letter by application.
     */
    public Optional<PlacementLetter> getLetterByApplication(
            Integer applicationId) {

        return placementLetterRepository.findAll()
                .stream()
                .filter(letter ->
                        letter.getApplication() != null
                                && letter.getApplication()
                                .getApplicationId()
                                .equals(applicationId)
                )
                .findFirst();
    }

    /**
     * Delete placement letter.
     */
    public void deleteLetter(Integer id) {

        placementLetterRepository.deleteById(id);
    }
}