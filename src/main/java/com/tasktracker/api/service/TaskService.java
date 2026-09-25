package com.tasktracker.api.service;

import com.tasktracker.api.dto.CreateTaskRequest;
import com.tasktracker.api.dto.TaskResponse;
import com.tasktracker.api.dto.UpdateTaskRequest;
import com.tasktracker.api.exception.TaskNotFoundException;
import com.tasktracker.api.model.Task;
import com.tasktracker.api.model.TaskStatus;
import com.tasktracker.api.repository.TaskRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public Page<Task> list(Pageable pageable, TaskStatus status, String query) {
        return taskRepository.findAllFiltered(status, normalizeQuery(query), pageable);
    }

    public TaskResponse get(long id) {
        return TaskResponse.from(findTask(id));
    }

    @Transactional
    public TaskResponse create(CreateTaskRequest request) {
        Task task = new Task(normalizeRequired(request.title()), normalizeDescription(request.description()));
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(long id, UpdateTaskRequest request) {
        Task task = findTask(id);
        String title = request.title() == null ? task.getTitle() : normalizeRequired(request.title());
        String description = request.description() == null ? task.getDescription() : normalizeDescription(request.description());
        TaskStatus status = request.status() == null ? task.getStatus() : request.status();
        task.update(title, description, status);
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(long id) {
        taskRepository.delete(findTask(id));
    }

    private Task findTask(long id) {
        return taskRepository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
    }

    private String normalizeRequired(String value) {
        String normalized = value == null ? null : value.trim();
        if (normalized == null || normalized.isEmpty()) {
            throw new IllegalArgumentException("Title must not be blank");
        }
        return normalized;
    }

    private String normalizeDescription(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeQuery(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        return normalized.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
