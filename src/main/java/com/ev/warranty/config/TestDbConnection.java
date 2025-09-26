package com.ev.warranty.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class TestDbConnection implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.update("INSERT INTO test_table (name) VALUES (?)", "hello");
            System.out.println("✅ Insert OK");
        } catch (Exception e) {
            System.err.println("❌ DB error: " + e.getMessage());
        }
    }
}
