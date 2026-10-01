package com.example.duwasa_fams.repository;

import com.example.duwasa_fams.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Integer> {

}