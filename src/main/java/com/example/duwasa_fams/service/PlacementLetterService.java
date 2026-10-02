package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.PlacementLetter;
import com.example.duwasa_fams.repository.PlacementLetterRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PlacementLetterService {

    private final PlacementLetterRepository placementLetterRepository;

    public PlacementLetterService(
            PlacementLetterRepository placementLetterRepository) {

        this.placementLetterRepository =
                placementLetterRepository;
    }

    // Save placement letter
    public PlacementLetter save(
            PlacementLetter letter) {

        return placementLetterRepository.save(letter);
    }

    // Get all placement letters
    public List<PlacementLetter> getAllLetters() {

        return placementLetterRepository.findAll();
    }

    // Get placement letter by ID
    public Optional<PlacementLetter> getLetterById(
            Integer id) {

        return placementLetterRepository.findById(id);
    }

    // Get placement letter by application
    public Optional<PlacementLetter>
    getLetterByApplication(
            Integer applicationId) {

        return placementLetterRepository.findAll()
                .stream()
                .filter(letter ->
                        letter.getApplication() != null
                                && letter.getApplication()
                                .getApplicationId()
                                .equals(applicationId))
                .findFirst();
    }

    // Delete placement letter
    public void deleteLetter(Integer id) {

        placementLetterRepository.deleteById(id);
    }
}