package com.example.duwasa_fams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "application_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Integer documentId;

    @ManyToOne
    @JoinColumn(name = "application_id")
    private FieldApplication application;

    @Column(name = "document_type")
    private String documentType;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "upload_date")
    private LocalDateTime uploadDate;

    @Column(name = "verification_status")
    private String verificationStatus;
}