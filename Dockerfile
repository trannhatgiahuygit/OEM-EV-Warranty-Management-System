# Multi-stage Dockerfile for Spring Boot app (Java 21)

# 1) Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy only the pom first to cache dependencies
COPY pom.xml ./
RUN mvn -B -q -DskipTests dependency:go-offline

# Copy source and build
COPY src ./src
RUN mvn -B -DskipTests clean package

# 2) Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Create uploads directory (persisted via volume in docker-compose)
RUN mkdir -p /app/uploads

# Copy built jar
COPY --from=builder /app/target/*.jar /app/app.jar

# Expose the default Spring Boot port
EXPOSE 8080

# Allow optional JVM options via JAVA_OPTS
ENV JAVA_OPTS=""

# Run the app
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

