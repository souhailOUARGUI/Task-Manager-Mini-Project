package org.example.backendtaskmanager.repositories;


import org.example.backendtaskmanager.entities.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUserId(Long userId);

    //I use the function for Get Details or update.
    Optional<Project> findByIdAndUserId(Long id, Long userId);

    //I use the function below for delete checks
    boolean existsByIdAndUserId(Long id, Long userId);
}
