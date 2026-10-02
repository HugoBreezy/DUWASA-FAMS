package com.example.duwasa_fams.controller;

import com.example.duwasa_fams.entity.Notification;
import com.example.duwasa_fams.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService) {

        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>>
    getAllNotifications() {

        return ResponseEntity.ok(
                notificationService.getAllNotifications()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notification>
    getNotificationById(
            @PathVariable Integer id) {

        return notificationService
                .getNotificationById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>>
    getUserNotifications(
            @PathVariable Integer userId) {

        return ResponseEntity.ok(
                notificationService
                        .getUserNotifications(userId)
        );
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<Notification>>
    getUnreadNotifications(
            @PathVariable Integer userId) {

        return ResponseEntity.ok(
                notificationService
                        .getUnreadNotifications(userId)
        );
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification>
    markAsRead(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                notificationService.markAsRead(id)
        );
    }

    @PostMapping
    public ResponseEntity<Notification>
    createNotification(
            @RequestBody Notification notification) {

        return ResponseEntity.ok(
                notificationService.save(notification)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteNotification(
            @PathVariable Integer id) {

        notificationService.deleteNotification(id);

        return ResponseEntity.noContent().build();
    }
}