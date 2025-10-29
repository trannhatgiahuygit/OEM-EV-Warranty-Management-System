package com;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootApplication
@ComponentScan(basePackages = {"com", "com.ev.warranty"})
public class RunApplication {

    @Autowired
    private DataSource dataSource;

    public static void main(String[] args) {
        SpringApplication.run(RunApplication.class, args);
    }

    @Bean
    public CommandLineRunner testDatabaseConnection() {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                System.out.println("Database connection test:");
                System.out.println("Database: " + connection.getCatalog());
                System.out.println("Schema: " + connection.getSchema());
                System.out.println("URL: " + connection.getMetaData().getURL());
                System.out.println("Database connection successful!");
            } catch (Exception e) {
                System.err.println("Database connection failed!");
                System.err.println("Error: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }
}
