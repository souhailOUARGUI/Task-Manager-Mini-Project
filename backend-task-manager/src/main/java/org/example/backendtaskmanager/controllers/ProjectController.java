package org.example.backendtaskmanager.controllers;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backendtaskmanager.dtos.ProjectRequest;
import org.example.backendtaskmanager.dtos.ProjectResponse;
import org.example.backendtaskmanager.services.ProjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.createProject(request, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getUserProjects(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(projectService.getUserProjects(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(projectService.getProjectById(id, userDetails.getUsername()));
    }
}
