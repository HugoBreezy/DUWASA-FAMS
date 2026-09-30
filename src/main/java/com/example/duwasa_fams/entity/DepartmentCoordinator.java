package com.example.duwasa_fams.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "department_coordinators")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentCoordinator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "department_coordinator_id")
    private Integer departmentCoordinatorId;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToOne
    @JoinColumn(name = "department_id")
    private Department department;
}