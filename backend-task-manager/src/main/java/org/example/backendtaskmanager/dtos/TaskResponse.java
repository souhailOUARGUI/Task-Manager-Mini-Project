package org.example.backendtaskmanager.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import org.example.backendtaskmanager.enums.TaskStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponse {
    private Long id;
    private String description;
    private String title;
    private TaskStatus status;
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

}
