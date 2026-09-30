package com.example.duwasa_fams.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "department_id")
    private Integer departmentId;

    @Column(name = "department_name", unique = true)
    private String departmentName;

    @Column(name = "description")
    private String description;

    @Column(name = "total_slots")
    private Integer totalSlots;

    @Column(name = "occupied_slots")
    private Integer occupiedSlots;

    @Column(name = "status")
    private String status;
}