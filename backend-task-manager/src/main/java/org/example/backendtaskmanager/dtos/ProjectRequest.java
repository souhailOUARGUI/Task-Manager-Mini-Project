package org.example.backendtaskmanager.dtos;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectRequest {
    @NotBlank(message = "title is required")
    @Size(max = 100, message = "The title must be less than 100 characters")
    private String title;

    @Size(max = 500, message = "The description must be less than 500 characters")
    private String description;
}
