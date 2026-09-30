package com.example.duwasa_fams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "application_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Integer historyId;

    @ManyToOne
    @JoinColumn(name = "application_id")
    private FieldApplication application;

    @ManyToOne
    @JoinColumn(name = "performed_by")
    private User performedBy;

    @Column(name = "action")
    private String action;

    @Column(name = "comments")
    private String comments;

    @Column(name = "action_date")
    private LocalDateTime actionDate;
}