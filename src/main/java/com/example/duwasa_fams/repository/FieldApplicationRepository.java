package com.example.duwasa_fams.repository;

import com.example.duwasa_fams.entity.FieldApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FieldApplicationRepository
        extends JpaRepository<FieldApplication, Integer> {

    List<FieldApplication> findByStudent_StudentId(Integer studentId);
}