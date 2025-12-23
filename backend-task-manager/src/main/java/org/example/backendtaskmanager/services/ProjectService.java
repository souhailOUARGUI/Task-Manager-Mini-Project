package org.example.backendtaskmanager.services;


import lombok.RequiredArgsConstructor;
import org.example.backendtaskmanager.dtos.ProjectRequest;
import org.example.backendtaskmanager.dtos.ProjectResponse;
import org.example.backendtaskmanager.entities.Project;
import org.example.backendtaskmanager.entities.User;
import org.example.backendtaskmanager.enums.TaskStatus;
import org.example.backendtaskmanager.exceptions.ResourceNotFoundException;
import org.example.backendtaskmanager.repositories.ProjectRepository;
import org.example.backendtaskmanager.repositories.TaskRepository;
import org.example.backendtaskmanager.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    public ProjectResponse createProject(ProjectRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = Project.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .user(user)
                .build();

        project = projectRepository.save(project);
        return mapToResponse(project);
    }

    public List<ProjectResponse> getUserProjects(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return projectRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long projectId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        return mapToResponse(project);
    }

    private ProjectResponse mapToResponse(Project project) {
        long totalTasks = taskRepository.countByProjectId(project.getId());
        long completedTasks = taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.COMPLETED);
        double progress = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0;

        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .createdAt(project.getCreatedAt())
                .totalTasks((int) totalTasks)
                .completedTasks((int) completedTasks)
                .progressPercentage(Math.round(progress * 100.0) / 100.0)
                .build();
    }

}
