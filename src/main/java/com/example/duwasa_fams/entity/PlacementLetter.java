package com.example.duwasa_fams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "placement_letters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlacementLetter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "letter_id")
    private Integer letterId;

    @OneToOne
    @JoinColumn(name = "application_id", unique = true)
    private FieldApplication application;

    @Column(name = "letter_number", unique = true)
    private String letterNumber;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_path")
    private String filePath;
}