package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.ApplicationDocument;
import com.example.duwasa_fams.entity.ApplicationHistory;
import com.example.duwasa_fams.entity.Department;
import com.example.duwasa_fams.entity.DepartmentCoordinator;
import com.example.duwasa_fams.entity.FieldApplication;
import com.example.duwasa_fams.entity.Notification;
import com.example.duwasa_fams.entity.User;
import com.example.duwasa_fams.repository.ApplicationDocumentRepository;
import com.example.duwasa_fams.repository.ApplicationHistoryRepository;
import com.example.duwasa_fams.repository.DepartmentCoordinatorRepository;
import com.example.duwasa_fams.repository.DepartmentRepository;
import com.example.duwasa_fams.repository.FieldApplicationRepository;
import com.example.duwasa_fams.repository.NotificationRepository;
import com.example.duwasa_fams.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FieldApplicationService {

    private final FieldApplicationRepository fieldApplicationRepository;
    private final DepartmentRepository departmentRepository;
    private final DepartmentCoordinatorRepository departmentCoordinatorRepository;
    private final ApplicationHistoryRepository applicationHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ApplicationDocumentRepository applicationDocumentRepository;

    public FieldApplicationService(
            FieldApplicationRepository fieldApplicationRepository,
            DepartmentRepository departmentRepository,
            DepartmentCoordinatorRepository departmentCoordinatorRepository,
            ApplicationHistoryRepository applicationHistoryRepository,
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            ApplicationDocumentRepository applicationDocumentRepository) {

        this.fieldApplicationRepository = fieldApplicationRepository;
        this.departmentRepository = departmentRepository;
        this.departmentCoordinatorRepository =
                departmentCoordinatorRepository;
        this.applicationHistoryRepository =
                applicationHistoryRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.applicationDocumentRepository =
                applicationDocumentRepository;
    }

    // =========================================================
    // CREATE APPLICATION
    // =========================================================

    public FieldApplication createApplication(
            FieldApplication application) {

        if (application.getStudent() == null) {
            throw new RuntimeException("Student is required");
        }

        if (application.getDepartment() == null
                || application.getDepartment().getDepartmentId() == null) {

            throw new RuntimeException("Department is required");
        }

        Department department = departmentRepository
                .findById(
                        application.getDepartment()
                                .getDepartmentId()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Selected department not found"));

        // Check department availability before creating the application
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
                    "No available slot in the selected department");
        }

        application.setDepartment(department);
        application.setApplicationDate(LocalDateTime.now());
        application.setStatus("DRAFT");

        return fieldApplicationRepository.save(application);
    }

    // =========================================================
    // VALIDATE APPLICATION
    // =========================================================

    public FieldApplication validateApplication(Integer id) {

        FieldApplication application =
                fieldApplicationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"));

        if (application.getStudent() == null) {
            throw new RuntimeException(
                    "Student information is required");
        }

        if (application.getDepartment() == null) {
            throw new RuntimeException(
                    "Department selection is required");
        }

        if (application.getStartDate() == null) {
            throw new RuntimeException(
                    "Start date is required");
        }

        if (application.getEndDate() == null) {
            throw new RuntimeException(
                    "End date is required");
        }

        // Start date must not be in the past
        LocalDate today = LocalDate.now();

        if (application.getStartDate().isBefore(today)) {
            throw new RuntimeException(
                    "Start date cannot be in the past");
        }

        // End date must be after start date
        if (!application.getEndDate()
                .isAfter(application.getStartDate())) {

            throw new RuntimeException(
                    "End date must be after start date");
        }

        // Check department availability again during validation
        checkAvailableSlot(id);

        return application;
    }

    // =========================================================
    // SUBMIT APPLICATION
    // =========================================================

    public FieldApplication submitApplication(Integer id) {

        FieldApplication application =
                validateApplication(id);

        if (!"DRAFT".equals(application.getStatus())) {
            throw new RuntimeException(
                    "Only draft applications can be submitted");
        }

        // Check slots again immediately before submission
        checkAvailableSlot(id);

        application.setApplicationDate(LocalDateTime.now());
        application.setStatus("PENDING_HR_REVIEW");

        FieldApplication savedApplication =
                fieldApplicationRepository.save(application);

        ApplicationHistory history =
                new ApplicationHistory();

        history.setApplication(savedApplication);
        history.setAction("SUBMITTED");
        history.setComments(
                "Application submitted and sent to HR for review"
        );
        history.setActionDate(LocalDateTime.now());

        applicationHistoryRepository.save(history);

        List<User> hrOfficers =
                userRepository.findAll()
                        .stream()
                        .filter(user ->
                                "HR_OFFICER".equalsIgnoreCase(
                                        user.getRole()))
                        .toList();

        for (User hrOfficer : hrOfficers) {

            Notification notification =
                    new Notification();

            notification.setUser(hrOfficer);
            notification.setApplication(savedApplication);

            notification.setMessage(
                    "A new field application has been submitted and is waiting for HR review."
            );

            notification.setNotificationType(
                    "APPLICATION_SUBMITTED"
            );

            notification.setSentDate(
                    LocalDateTime.now()
            );

            notification.setStatus("UNREAD");

            notificationRepository.save(notification);
        }

        return savedApplication;
    }

    // =========================================================
    // GET APPLICATIONS FOR HR REVIEW
    // =========================================================

    public List<FieldApplication> getApplicationsForHRReview() {

        return fieldApplicationRepository.findAll()
                .stream()
                .filter(application ->
                        "PENDING_HR_REVIEW".equals(
                                application.getStatus()))
                .toList();
    }

    // =========================================================
    // VERIFY APPLICATION DOCUMENTS
    // =========================================================

    public List<ApplicationDocument> verifyApplicationDocuments(
            Integer applicationId) {

        fieldApplicationRepository.findById(applicationId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Application not found"));

        List<ApplicationDocument> documents =
                applicationDocumentRepository.findAll()
                        .stream()
                        .filter(document ->
                                document.getApplication() != null
                                        && document.getApplication()
                                        .getApplicationId()
                                        .equals(applicationId))
                        .toList();

        if (documents.isEmpty()) {
            throw new RuntimeException(
                    "Application has no uploaded documents");
        }

        return documents;
    }

    // =========================================================
    // CHECK APPLICATION REQUIREMENTS
    // =========================================================

    public FieldApplication checkRequirements(
            Integer applicationId) {

        FieldApplication application =
                fieldApplicationRepository.findById(applicationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"));

        if (application.getStudent() == null) {
            throw new RuntimeException(
                    "Student information is incomplete");
        }

        if (application.getDepartment() == null) {
            throw new RuntimeException(
                    "Selected department is required");
        }

        if (application.getStartDate() == null
                || application.getEndDate() == null) {

            throw new RuntimeException(
                    "Training period is incomplete");
        }

        // Validate dates before HR forwarding
        LocalDate today = LocalDate.now();

        if (application.getStartDate().isBefore(today)) {
            throw new RuntimeException(
                    "Start date cannot be in the past");
        }

        if (!application.getEndDate()
                .isAfter(application.getStartDate())) {

            throw new RuntimeException(
                    "End date must be after start date");
        }

        List<ApplicationDocument> documents =
                verifyApplicationDocuments(applicationId);

        boolean hasPendingDocument =
                documents.stream()
                        .anyMatch(document ->
                                "PENDING".equalsIgnoreCase(
                                        document.getVerificationStatus()));

        if (hasPendingDocument) {
            throw new RuntimeException(
                    "All documents must be verified before forwarding the application");
        }

        boolean hasRejectedDocument =
                documents.stream()
                        .anyMatch(document ->
                                "REJECTED".equalsIgnoreCase(
                                        document.getVerificationStatus()));

        if (hasRejectedDocument) {
            throw new RuntimeException(
                    "Application contains rejected documents");
        }

        return application;
    }

    // =========================================================
    // CHECK AVAILABLE SLOT
    // =========================================================

    public Integer checkAvailableSlot(Integer applicationId) {

        FieldApplication application =
                fieldApplicationRepository.findById(applicationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"));

        if (application.getDepartment() == null) {
            throw new RuntimeException(
                    "Application has no selected department");
        }

        Department department =
                departmentRepository.findById(
                        application.getDepartment()
                                .getDepartmentId()
                ).orElseThrow(() ->
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
                    "No available slot in the selected department");
        }

        return availableSlots;
    }

    // =========================================================
    // FORWARD TO DEPARTMENT
    // =========================================================

    public FieldApplication forwardToDepartment(
            Integer applicationId) {

        FieldApplication application =
                checkRequirements(applicationId);

        if (!"PENDING_HR_REVIEW".equals(
                application.getStatus())) {

            throw new RuntimeException(
                    "Application is not waiting for HR review");
        }

        checkAvailableSlot(applicationId);

        application.setStatus(
                "PENDING_DEPARTMENT_REVIEW"
        );

        FieldApplication savedApplication =
                fieldApplicationRepository.save(application);

        ApplicationHistory history =
                new ApplicationHistory();

        history.setApplication(savedApplication);
        history.setAction(
                "FORWARDED_TO_DEPARTMENT"
        );

        history.setComments(
                "HR reviewed the application and forwarded it to the selected department."
        );

        history.setActionDate(LocalDateTime.now());

        applicationHistoryRepository.save(history);

        DepartmentCoordinator coordinator =
                departmentCoordinatorRepository
                        .findAll()
                        .stream()
                        .filter(item ->
                                item.getDepartment() != null
                                        && item.getDepartment()
                                        .getDepartmentId()
                                        .equals(
                                                savedApplication
                                                        .getDepartment()
                                                        .getDepartmentId()
                                        ))
                        .findFirst()
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "No coordinator assigned to the selected department"));

        Notification notification =
                new Notification();

        notification.setUser(
                coordinator.getUser()
        );

        notification.setApplication(
                savedApplication
        );

        notification.setMessage(
                "A new field application has been forwarded to your department for review."
        );

        notification.setNotificationType(
                "APPLICATION_FORWARDED"
        );

        notification.setSentDate(
                LocalDateTime.now()
        );

        notification.setStatus("UNREAD");

        notificationRepository.save(notification);

        return savedApplication;
    }

    // =========================================================
    // REJECT APPLICATION BY HR
    // =========================================================

    public FieldApplication rejectByHR(
            Integer applicationId,
            String reason) {

        FieldApplication application =
                fieldApplicationRepository.findById(applicationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"));

        if (!"PENDING_HR_REVIEW".equals(
                application.getStatus())) {

            throw new RuntimeException(
                    "Application is not waiting for HR review");
        }

        if (reason == null || reason.isBlank()) {
            throw new RuntimeException(
                    "Rejection reason is required");
        }

        application.setStatus(
                "REJECTED_BY_HR"
        );

        application.setComments(reason);

        FieldApplication savedApplication =
                fieldApplicationRepository.save(application);

        ApplicationHistory history =
                new ApplicationHistory();

        history.setApplication(savedApplication);
        history.setAction("REJECTED_BY_HR");
        history.setComments(reason);
        history.setActionDate(LocalDateTime.now());

        applicationHistoryRepository.save(history);

        Notification notification =
                new Notification();

        notification.setUser(
                savedApplication
                        .getStudent()
                        .getUser()
        );

        notification.setApplication(
                savedApplication
        );

        notification.setMessage(
                "Your field application has been rejected by HR. Reason: "
                        + reason
        );

        notification.setNotificationType(
                "APPLICATION_REJECTED_BY_HR"
        );

        notification.setSentDate(
                LocalDateTime.now()
        );

        notification.setStatus("UNREAD");

        notificationRepository.save(notification);

        return savedApplication;
    }

    // =========================================================
    // GET ALL APPLICATIONS
    // =========================================================

    public List<FieldApplication> getAllApplications() {

        return fieldApplicationRepository.findAll();
    }

    // =========================================================
    // GET APPLICATION BY ID
    // =========================================================

    public Optional<FieldApplication> getApplicationById(
            Integer id) {

        return fieldApplicationRepository.findById(id);
    }

    // =========================================================
    // GET APPLICATIONS FOR STUDENT
    // =========================================================

    public List<FieldApplication> getApplicationsByStudent(
            Integer studentId) {

        return fieldApplicationRepository
                .findByStudent_StudentId(studentId);
    }

    // =========================================================
    // UPDATE APPLICATION
    // =========================================================

    public FieldApplication updateApplication(
            Integer id,
            FieldApplication application) {

        FieldApplication existingApplication =
                fieldApplicationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"));

        if (application.getDepartment() != null
                && application.getDepartment()
                .getDepartmentId() != null) {

            Department department =
                    departmentRepository.findById(
                            application.getDepartment()
                                    .getDepartmentId()
                    ).orElseThrow(() ->
                            new RuntimeException(
                                    "Selected department not found"));

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
                        "No available slot in the selected department");
            }

            existingApplication.setDepartment(department);
        }

        // Validate start date when provided
        if (application.getStartDate() != null) {

            LocalDate today = LocalDate.now();

            if (application.getStartDate().isBefore(today)) {
                throw new RuntimeException(
                        "Start date cannot be in the past");
            }
        }

        // Validate end date when both dates are provided
        if (application.getStartDate() != null
                && application.getEndDate() != null
                && !application.getEndDate()
                .isAfter(application.getStartDate())) {

            throw new RuntimeException(
                    "End date must be after start date");
        }

        existingApplication.setStudent(
                application.getStudent());

        existingApplication.setStartDate(
                application.getStartDate());

        existingApplication.setEndDate(
                application.getEndDate());

        existingApplication.setStatus(
                application.getStatus());

        existingApplication.setComments(
                application.getComments());

        return fieldApplicationRepository.save(
                existingApplication);
    }

    // =========================================================
    // CHANGE APPLICATION STATUS
    // =========================================================

    public FieldApplication changeStatus(
            Integer id,
            String status) {

        FieldApplication application =
                fieldApplicationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"));

        application.setStatus(status);

        return fieldApplicationRepository.save(
                application);
    }

    // =========================================================
    // ADD COMMENT
    // =========================================================

    public FieldApplication addComment(
            Integer id,
            String comments) {

        FieldApplication application =
                fieldApplicationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application not found"));

        application.setComments(comments);

        return fieldApplicationRepository.save(
                application);
    }

    // =========================================================
    // DELETE APPLICATION
    // =========================================================

    public void deleteApplication(Integer id) {

        fieldApplicationRepository.deleteById(id);
    }
}