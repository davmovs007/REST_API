package com.tasktracker.api.dto;

import com.tasktracker.api.model.TaskStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Data required to create a task")
public record CreateTaskRequest(
        @Schema(example = "Prepare quarterly report")
        @NotBlank(message = "Title must not be blank")
        @Size(max = 100, message = "Title must not exceed 100 characters")
        String title,

        @Schema(example = "Collect and review Q3 metrics")
        @Size(max = 2_000, message = "Description must not exceed 2000 characters")
        String description,

        @Schema(example = "NEW", defaultValue = "NEW")
        TaskStatus status
) {
}
