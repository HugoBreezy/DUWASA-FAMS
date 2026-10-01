package com.example.duwasa_fams.repository;

import com.example.duwasa_fams.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository
        extends JpaRepository<Notification, Integer> {

}