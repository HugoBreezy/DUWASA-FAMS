package com.example.duwasa_fams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Integer notificationId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "application_id")
    private FieldApplication application;

    @Column(name = "message")
    private String message;

    @Column(name = "notification_type")
    private String notificationType;

    @Column(name = "sent_date")
    private LocalDateTime sentDate;

    @Column(name = "status")
    private String status;
}