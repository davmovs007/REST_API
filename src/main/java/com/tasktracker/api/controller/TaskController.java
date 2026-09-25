package com.tasktracker.api.controller;

import com.tasktracker.api.dto.CreateTaskRequest;
import com.tasktracker.api.dto.PagedResponse;
import com.tasktracker.api.dto.TaskResponse;
import com.tasktracker.api.dto.UpdateTaskRequest;
import com.tasktracker.api.model.Task;
import com.tasktracker.api.model.TaskStatus;
import com.tasktracker.api.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/tasks")
@Tag(name = "Tasks", description = "Create, view, update, and delete tasks")
@Validated
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    @Operation(summary = "List tasks", description = "Returns a paginated task collection, newest first.")
    @ApiResponse(responseCode = "200", description = "Tasks returned")
    public PagedResponse<TaskResponse> list(
            @Parameter(description = "Zero-based page number", example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Items per page (1-100)", example = "20")
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @Parameter(description = "Optional status filter", example = "IN_PROGRESS")
            @RequestParam(required = false) TaskStatus status,
            @Parameter(description = "Optional title or description search", example = "report")
            @RequestParam(required = false) @Size(max = 100) String query
    ) {
        Page<Task> tasks = taskService.list(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")), status, query);
        return PagedResponse.from(tasks, TaskResponse::from);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one task")
    @ApiResponse(responseCode = "200", description = "Task returned")
    @ApiResponse(responseCode = "404", description = "Task not found",
            content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class)))
    public TaskResponse get(@PathVariable @Positive long id) {
        return taskService.get(id);
    }

    @PostMapping
    @Operation(summary = "Create a task")
    @ApiResponse(responseCode = "201", description = "Task created")
    @ApiResponse(responseCode = "400", description = "Invalid request",
            content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class)))
    public ResponseEntity<TaskResponse> create(@Valid @RequestBody CreateTaskRequest request) {
        TaskResponse response = taskService.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/tasks/" + response.id()))
                .body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a task", description = "Updates supplied fields; a status-only body is supported.")
    @ApiResponse(responseCode = "200", description = "Task updated")
    @ApiResponse(responseCode = "404", description = "Task not found",
            content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class)))
    public TaskResponse update(@PathVariable @Positive long id, @Valid @RequestBody UpdateTaskRequest request) {
        return taskService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a task")
    @ApiResponse(responseCode = "204", description = "Task deleted")
    @ApiResponse(responseCode = "404", description = "Task not found",
            content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class)))
    public ResponseEntity<Void> delete(@PathVariable @Positive long id) {
        taskService.delete(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
