package org.example.backendtaskmanager.dtos;


import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime createdAt;
    private int totalTasks;
    private int completedTasks;
    private double progressPercentage;
}
