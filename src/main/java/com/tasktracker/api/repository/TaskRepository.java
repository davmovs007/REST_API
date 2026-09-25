package com.tasktracker.api.repository;

import com.tasktracker.api.model.Task;
import com.tasktracker.api.model.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("""
            SELECT task FROM Task task
            WHERE (:status IS NULL OR task.status = :status)
              AND (:query IS NULL
                   OR ((LOWER(task.title) LIKE LOWER(CONCAT('%', :query, '%')) ESCAPE '\\')
                       OR (LOWER(COALESCE(task.description, '')) LIKE LOWER(CONCAT('%', :query, '%')) ESCAPE '\\')))
            """)
    Page<Task> findAllFiltered(@Param("status") TaskStatus status, @Param("query") String query, Pageable pageable);
}
