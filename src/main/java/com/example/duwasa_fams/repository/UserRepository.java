package com.example.duwasa_fams.repository;

import com.example.duwasa_fams.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {

}