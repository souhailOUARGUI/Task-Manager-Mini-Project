package org.example.backendtaskmanager.services;


import lombok.RequiredArgsConstructor;
import org.example.backendtaskmanager.dtos.TaskRequest;
import org.example.backendtaskmanager.dtos.TaskResponse;
import org.example.backendtaskmanager.entities.Project;
import org.example.backendtaskmanager.entities.Task;
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
public class TaskService {
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public TaskResponse createTask(Long projectId, TaskRequest request, String userEmail) {
        Project project = getProjectForUser(projectId, userEmail);

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .status(TaskStatus.PENDING)
                .project(project)
                .build();

        task = taskRepository.save(task);
        return mapToResponse(task);
    }

    public List<TaskResponse> getTasksByProject(Long projectId, String userEmail) {
        Project project = getProjectForUser(projectId, userEmail);

        return taskRepository.findByProjectId(project.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse markTaskCompleted(Long projectId, Long taskId, String userEmail) {
        // 1. Verify user owns the project
        getProjectForUser(projectId, userEmail);

        // 2. Find the task
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        // 3. Update status using Enum
        task.setStatus(TaskStatus.COMPLETED);

        task = taskRepository.save(task);
        return mapToResponse(task);
    }


    public void deleteTask(Long projectId, Long taskId, String userEmail) {
        getProjectForUser(projectId, userEmail);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        taskRepository.delete(task);
    }


    private Project getProjectForUser(Long projectId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private TaskResponse mapToResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .dueDate(task.getDueDate())
                .status(task.getStatus())
                .createdAt(task.getCreatedAt())
                .build();
    }


}
