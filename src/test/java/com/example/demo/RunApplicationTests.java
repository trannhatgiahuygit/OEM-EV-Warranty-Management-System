package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DatabaseConnectionTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void testDatabaseConnection() {
        assertDoesNotThrow(() -> {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            assertEquals(1, result);
        }, "Database connection failed");
    }

    @Test
    void testDatabaseMetadata() {
        assertDoesNotThrow(() -> {
            String dbProduct = jdbcTemplate.getDataSource()
                    .getConnection()
                    .getMetaData()
                    .getDatabaseProductName();
            assertNotNull(dbProduct);
            System.out.println("Connected to: " + dbProduct);
        }, "Could not get database metadata");
    }
}
