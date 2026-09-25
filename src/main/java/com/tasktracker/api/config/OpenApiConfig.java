package com.tasktracker.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI taskManagementOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Task Management API")
                .version("1.0.0")
                .description("REST API for creating, tracking, updating, and deleting tasks.")
                .contact(new Contact().name("Task Tracker Team"))
                .license(new License().name("MIT")));
    }
}
