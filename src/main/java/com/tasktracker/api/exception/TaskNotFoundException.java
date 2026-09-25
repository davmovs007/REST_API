package com.tasktracker.api.exception;

public class TaskNotFoundException extends RuntimeException {

    public TaskNotFoundException(long id) {
        super("Task with id " + id + " was not found");
    }
}
