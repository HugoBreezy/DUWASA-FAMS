package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.Student;
import com.example.duwasa_fams.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    // Save student
    public Student save(Student student) {
        return studentRepository.save(student);
    }

    // Get all students
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    // Get student by ID
    public Optional<Student> getStudentById(Integer id) {
        return studentRepository.findById(id);
    }

    // Complete student profile
    public Student completeProfile(
            Integer studentId,
            Student student) {

        Student existingStudent = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new RuntimeException("Student not found"));

        existingStudent.setRegistrationNumber(
                student.getRegistrationNumber()
        );

        existingStudent.setCollegeName(
                student.getCollegeName()
        );

        existingStudent.setCourse(
                student.getCourse()
        );

        existingStudent.setYearOfStudy(
                student.getYearOfStudy()
        );

        return studentRepository.save(existingStudent);
    }

    // Update student profile
    public Student updateStudent(
            Integer id,
            Student student) {

        Student existingStudent = studentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Student not found"));

        existingStudent.setUser(student.getUser());
        existingStudent.setRegistrationNumber(
                student.getRegistrationNumber()
        );
        existingStudent.setCollegeName(
                student.getCollegeName()
        );
        existingStudent.setCourse(
                student.getCourse()
        );
        existingStudent.setYearOfStudy(
                student.getYearOfStudy()
        );

        return studentRepository.save(existingStudent);
    }

    // Delete student
    public void deleteStudent(Integer id) {
        studentRepository.deleteById(id);
    }
}