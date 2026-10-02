package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.Department;
import com.example.duwasa_fams.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(
            DepartmentRepository departmentRepository) {

        this.departmentRepository = departmentRepository;
    }

    // =========================================================
    // CREATE DEPARTMENT
    // =========================================================

    public Department createDepartment(
            Department department) {

        if (department.getDepartmentName() == null
                || department.getDepartmentName().isBlank()) {

            throw new RuntimeException(
                    "Department name is required");
        }

        boolean exists =
                departmentRepository.findAll()
                        .stream()
                        .anyMatch(existing ->
                                existing.getDepartmentName()
                                        .equalsIgnoreCase(
                                                department.getDepartmentName()));

        if (exists) {
            throw new RuntimeException(
                    "Department already exists");
        }

        if (department.getTotalSlots() == null
                || department.getTotalSlots() < 0) {

            throw new RuntimeException(
                    "Total slots must be zero or greater");
        }

        department.setOccupiedSlots(0);

        if (department.getStatus() == null
                || department.getStatus().isBlank()) {

            department.setStatus("ACTIVE");
        }

        return departmentRepository.save(department);
    }

    // =========================================================
    // GET ALL DEPARTMENTS
    // =========================================================

    public List<Department> getAllDepartments() {

        return departmentRepository.findAll();
    }

    // =========================================================
    // GET DEPARTMENT BY ID
    // =========================================================

    public Optional<Department> getDepartmentById(
            Integer id) {

        return departmentRepository.findById(id);
    }

    // =========================================================
    // UPDATE DEPARTMENT
    // =========================================================

    public Department updateDepartment(
            Integer id,
            Department department) {

        Department existingDepartment =
                departmentRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Department not found"));

        if (department.getDepartmentName() == null
                || department.getDepartmentName().isBlank()) {

            throw new RuntimeException(
                    "Department name is required");
        }

        if (department.getTotalSlots() == null
                || department.getTotalSlots() < 0) {

            throw new RuntimeException(
                    "Total slots must be zero or greater");
        }

        int occupiedSlots =
                existingDepartment.getOccupiedSlots() == null
                        ? 0
                        : existingDepartment.getOccupiedSlots();

        if (department.getTotalSlots() < occupiedSlots) {

            throw new RuntimeException(
                    "Total slots cannot be less than occupied slots");
        }

        existingDepartment.setDepartmentName(
                department.getDepartmentName());

        existingDepartment.setDescription(
                department.getDescription());

        existingDepartment.setTotalSlots(
                department.getTotalSlots());

        existingDepartment.setStatus(
                department.getStatus());

        return departmentRepository.save(
                existingDepartment);
    }

    // =========================================================
    // UPDATE DEPARTMENT STATUS
    // =========================================================

    public Department changeDepartmentStatus(
            Integer id,
            String status) {

        Department department =
                departmentRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Department not found"));

        if (status == null || status.isBlank()) {

            throw new RuntimeException(
                    "Status is required");
        }

        department.setStatus(
                status.toUpperCase());

        return departmentRepository.save(
                department);
    }

    // =========================================================
    // DELETE DEPARTMENT
    // =========================================================

    public void deleteDepartment(
            Integer id) {

        if (!departmentRepository.existsById(id)) {

            throw new RuntimeException(
                    "Department not found");
        }

        departmentRepository.deleteById(id);
    }
}