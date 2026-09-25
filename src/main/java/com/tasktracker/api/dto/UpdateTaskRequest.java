package com.tasktracker.api.dto;

import com.tasktracker.api.model.TaskStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Fields to update. A status-only request is supported for quick workflow changes.")
public record UpdateTaskRequest(
        @Schema(example = "Prepare corrected quarterly report")
        @Size(max = 100, message = "Title must not exceed 100 characters")
        @Pattern(regexp = ".*\\S.*", message = "Title must not be blank")
        String title,

        @Schema(example = "Include regional comparison")
        @Size(max = 2_000, message = "Description must not exceed 2000 characters")
        String description,

        @Schema(example = "IN_PROGRESS")
        TaskStatus status
) {
    @AssertTrue(message = "Provide at least one field to update")
    public boolean hasUpdate() {
        return title != null || description != null || status != null;
    }
}
