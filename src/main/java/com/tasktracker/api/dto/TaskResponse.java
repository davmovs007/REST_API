package com.tasktracker.api.dto;

import com.tasktracker.api.model.Task;
import com.tasktracker.api.model.TaskStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "A task in the task tracker")
public record TaskResponse(
        @Schema(example = "101") Long id,
        @Schema(example = "Prepare quarterly report") String title,
        @Schema(example = "Collect and review Q3 metrics") String description,
        @Schema(example = "IN_PROGRESS") TaskStatus status,
        @Schema(example = "2023-10-15T14:30:00Z") Instant createdAt
) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getCreatedAt()
        );
    }
}
