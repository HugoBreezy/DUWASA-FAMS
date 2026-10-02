package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.ApplicationHistory;
import com.example.duwasa_fams.repository.ApplicationHistoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ApplicationHistoryService {

    private final ApplicationHistoryRepository historyRepository;

    public ApplicationHistoryService(
            ApplicationHistoryRepository historyRepository) {

        this.historyRepository = historyRepository;
    }

    public ApplicationHistory save(ApplicationHistory history) {

        if (history.getActionDate() == null) {
            history.setActionDate(LocalDateTime.now());
        }

        return historyRepository.save(history);
    }

    public List<ApplicationHistory> getAllHistory() {

        return historyRepository.findAll();
    }

    public Optional<ApplicationHistory> getHistoryById(
            Integer id) {

        return historyRepository.findById(id);
    }

    public List<ApplicationHistory> getApplicationHistory(
            Integer applicationId) {

        return historyRepository.findAll()
                .stream()
                .filter(history ->
                        history.getApplication() != null
                                && history.getApplication()
                                .getApplicationId()
                                .equals(applicationId))
                .toList();
    }

    public void deleteHistory(Integer id) {

        historyRepository.deleteById(id);
    }
}