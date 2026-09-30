package com.example.duwasa_fams.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_id")
    private Integer studentId;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "registration_number", unique = true)
    private String registrationNumber;

    @Column(name = "college_name")
    private String collegeName;

    @Column(name = "course")
    private String course;

    @Column(name = "year_of_study")
    private Integer yearOfStudy;
}