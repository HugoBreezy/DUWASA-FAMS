package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.Notification;
import com.example.duwasa_fams.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(
            NotificationRepository notificationRepository) {

        this.notificationRepository = notificationRepository;
    }

    public Notification save(Notification notification) {

        if (notification.getSentDate() == null) {
            notification.setSentDate(LocalDateTime.now());
        }

        if (notification.getStatus() == null) {
            notification.setStatus("UNREAD");
        }

        return notificationRepository.save(notification);
    }

    public List<Notification> getAllNotifications() {

        return notificationRepository.findAll();
    }

    public Optional<Notification> getNotificationById(
            Integer id) {

        return notificationRepository.findById(id);
    }

    public List<Notification> getUserNotifications(
            Integer userId) {

        return notificationRepository.findAll()
                .stream()
                .filter(notification ->
                        notification.getUser() != null
                                && notification.getUser()
                                .getUserId()
                                .equals(userId))
                .toList();
    }

    public List<Notification> getUnreadNotifications(
            Integer userId) {

        return notificationRepository.findAll()
                .stream()
                .filter(notification ->
                        notification.getUser() != null
                                && notification.getUser()
                                .getUserId()
                                .equals(userId)
                                && "UNREAD".equalsIgnoreCase(
                                notification.getStatus()))
                .toList();
    }

    public Notification markAsRead(Integer id) {

        Notification notification =
                notificationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"));

        notification.setStatus("READ");

        return notificationRepository.save(notification);
    }

    public void deleteNotification(Integer id) {

        notificationRepository.deleteById(id);
    }
}