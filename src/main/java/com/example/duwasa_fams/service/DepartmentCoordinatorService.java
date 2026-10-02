package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.ApplicationHistory;
import com.example.duwasa_fams.entity.Department;
import com.example.duwasa_fams.entity.DepartmentCoordinator;
import com.example.duwasa_fams.entity.FieldApplication;
import com.example.duwasa_fams.entity.Notification;
import com.example.duwasa_fams.entity.PlacementLetter;
import com.example.duwasa_fams.repository.ApplicationHistoryRepository;
import com.example.duwasa_fams.repository.DepartmentCoordinatorRepository;
import com.example.duwasa_fams.repository.DepartmentRepository;
import com.example.duwasa_fams.repository.FieldApplicationRepository;
import com.example.duwasa_fams.repository.NotificationRepository;
import com.example.duwasa_fams.repository.PlacementLetterRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DepartmentCoordinatorService {

    private final DepartmentCoordinatorRepository coordinatorRepository;
    private final FieldApplicationRepository applicationRepository;
    private final DepartmentRepository departmentRepository;
    private final ApplicationHistoryRepository historyRepository;
    private final NotificationRepository notificationRepository;
    private final PlacementLetterRepository placementLetterRepository;

    public DepartmentCoordinatorService(
            DepartmentCoordinatorRepository coordinatorRepository,
            FieldApplicationRepository applicationRepository,
            DepartmentRepository departmentRepository,
            ApplicationHistoryRepository historyRepository,
            NotificationRepository notificationRepository,
            PlacementLetterRepository placementLetterRepository) {

        this.coordinatorRepository = coordinatorRepository;
        this.applicationRepository = applicationRepository;
        this.departmentRepository = departmentRepository;
        this.historyRepository = historyRepository;
        this.notificationRepository = notificationRepository;
        this.placementLetterRepository = placementLetterRepository;
    }

    // Get all coordinators
    public List<DepartmentCoordinator> getAllCoordinators() {
        return coordinatorRepository.findAll();
    }

    // Get coordinator by ID
    public Optional<DepartmentCoordinator> getCoordinatorById(Integer id) {
        return coordinatorRepository.findById(id);
    }

    // Save coordinator
    public DepartmentCoordinator saveCoordinator(
            DepartmentCoordinator coordinator) {

        return coordinatorRepository.save(coordinator);
    }

    // Get applications forwarded to coordinator's department
    public List<FieldApplication> getForwardedApplications(
            Integer coordinatorId) {

        DepartmentCoordinator coordinator =
                coordinatorRepository.findById(coordinatorId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Department coordinator not found"));

        if (coordinator.getDepartment() == null) {
            throw new RuntimeException(
                    "Coordinator has no assigned department");
        }

        Integer departmentId =
                coordinator.getDepartment().getDepartmentId();

        return applicationRepository.findAll()
                .stream()
                .filter(application ->
                        application.getDepartment() != null
                                && application.getDepartment()
                                .getDepartmentId()
                                .equals(departmentId)
                                && "PENDING_DEPARTMENT_REVIEW"
                                .equals(application.getStatus()))
                .toList();
    }

    // Check available positions
    public Integer checkAvailablePositions(
            Integer applicationId) {

        FieldApplication application =
                applicationRepository.findById(applicationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"));

        if (application.getDepartment() == null) {
            throw new RuntimeException(
                    "Application has no department");
        }

        Department department =
                departmentRepository.findById(
                                application.getDepartment()
                                        .getDepartmentId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Department not found"));

        int totalSlots =
                department.getTotalSlots() == null
                        ? 0
                        : department.getTotalSlots();

        int occupiedSlots =
                department.getOccupiedSlots() == null
                        ? 0
                        : department.getOccupiedSlots();

        return totalSlots - occupiedSlots;
    }

    // Accept application
    public FieldApplication acceptApplication(
            Integer applicationId) {

        FieldApplication application =
                applicationRepository.findById(applicationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"));

        if (!"PENDING_DEPARTMENT_REVIEW"
                .equals(application.getStatus())) {

            throw new RuntimeException(
                    "Application is not waiting for department review");
        }

        Department department =
                departmentRepository.findById(
                                application.getDepartment()
                                        .getDepartmentId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Department not found"));

        int totalSlots =
                department.getTotalSlots() == null
                        ? 0
                        : department.getTotalSlots();

        int occupiedSlots =
                department.getOccupiedSlots() == null
                        ? 0
                        : department.getOccupiedSlots();

        int availableSlots =
                totalSlots - occupiedSlots;

        if (availableSlots <= 0) {
            throw new RuntimeException(
                    "No available position in this department");
        }

        // Increase occupied slots
        department.setOccupiedSlots(
                occupiedSlots + 1);

        departmentRepository.save(department);

        // Accept application
        application.setStatus("ACCEPTED");

        FieldApplication savedApplication =
                applicationRepository.save(application);

        // Record history
        ApplicationHistory history =
                new ApplicationHistory();

        history.setApplication(savedApplication);
        history.setAction("ACCEPTED");
        history.setComments(
                "Application accepted by Department Coordinator"
        );
        history.setActionDate(LocalDateTime.now());

        historyRepository.save(history);

        // Notify student
        Notification notification =
                new Notification();

        notification.setUser(
                savedApplication
                        .getStudent()
                        .getUser()
        );

        notification.setApplication(savedApplication);

        notification.setMessage(
                "Your field application has been accepted by the selected department."
        );

        notification.setNotificationType(
                "APPLICATION_ACCEPTED"
        );

        notification.setSentDate(
                LocalDateTime.now()
        );

        notification.setStatus("UNREAD");

        notificationRepository.save(notification);

        // Generate placement letter record
        createPlacementLetter(savedApplication);

        return savedApplication;
    }

    // Reject application
    public FieldApplication rejectApplication(
            Integer applicationId,
            String reason) {

        FieldApplication application =
                applicationRepository.findById(applicationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"));

        if (!"PENDING_DEPARTMENT_REVIEW"
                .equals(application.getStatus())) {

            throw new RuntimeException(
                    "Application is not waiting for department review");
        }

        if (reason == null || reason.isBlank()) {
            throw new RuntimeException(
                    "Rejection reason is required");
        }

        application.setStatus(
                "REJECTED_BY_DEPARTMENT"
        );

        application.setComments(reason);

        FieldApplication savedApplication =
                applicationRepository.save(application);

        // Record history
        ApplicationHistory history =
                new ApplicationHistory();

        history.setApplication(savedApplication);
        history.setAction("REJECTED");
        history.setComments(reason);
        history.setActionDate(LocalDateTime.now());

        historyRepository.save(history);

        // Notify student
        Notification notification =
                new Notification();

        notification.setUser(
                savedApplication
                        .getStudent()
                        .getUser()
        );

        notification.setApplication(savedApplication);

        notification.setMessage(
                "Your field application has been rejected by the selected department. Reason: "
                        + reason
        );

        notification.setNotificationType(
                "APPLICATION_REJECTED"
        );

        notification.setSentDate(
                LocalDateTime.now()
        );

        notification.setStatus("UNREAD");

        notificationRepository.save(notification);

        return savedApplication;
    }

    // Create placement letter record
    private PlacementLetter createPlacementLetter(
            FieldApplication application) {

        PlacementLetter letter =
                new PlacementLetter();

        letter.setApplication(application);

        letter.setLetterNumber(
                "DUWASA-FL-"
                        + application.getApplicationId()
        );

        letter.setIssueDate(
                LocalDate.now()
        );

        letter.setFileName(
                "placement-letter-"
                        + application.getApplicationId()
                        + ".pdf"
        );

        return placementLetterRepository.save(letter);
    }

    // Delete coordinator
    public void deleteCoordinator(Integer id) {
        coordinatorRepository.deleteById(id);
    }
}