---
name: spring-boot-dev
description: >-
  Provides best practices, design patterns, and conventions for Spring Boot 3.x and Java backend development.
  Covers layered architecture (Controller, Service, Repository, DTO), Spring Data JPA, Hibernate optimization,
  validation, and centralized exception handling.
  Use when developing, refactoring, or troubleshooting Spring Boot and Java applications.
---

# Spring Boot & Java Development Guide

This skill provides architectural standards, conventions, and implementation guidelines for modern Spring Boot applications.

---

## 1. Standard Layered Architecture

Always structure Spring Boot projects into cleanly separated layers:

```text
src/main/java/com/example/project/
├── config/              # Security, CORS, Swagger/OpenAPI configurations
├── controller/          # REST endpoints, HTTP request/response mappings
├── dto/                 # Data Transfer Objects (Request/Response records/classes)
│   ├── request/
│   └── response/
├── exception/           # Custom exceptions & @RestControllerAdvice handler
├── model/ / entity/     # JPA Entities with Hibernate annotations
├── repository/          # Spring Data JPA Repository interfaces
└── service/             # Business logic interfaces and implementations
    └── impl/
```

---

## 2. Core Best Practices

### A. Controllers
- Keep controllers thin: delegate business logic to service classes.
- Use explicit annotations (`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`).
- Validate incoming requests using `@Valid` with Jakarta Bean Validation annotations (`@NotBlank`, `@Email`, `@Min`, etc.).
- Return `ResponseEntity<T>` with appropriate HTTP status codes.

```java
@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    public ResponseEntity<PatientResponseDto> createPatient(@Valid @RequestBody CreatePatientRequestDto request) {
        PatientResponseDto created = patientService.createPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
```

### B. DTOs and Records
- Use Java `record`s for immutable DTOs in modern Java (17+).
- Never expose JPA Entities directly through API controllers to prevent data leakage and lazy-loading issues.

```java
public record CreatePatientRequestDto(
    @NotBlank(message = "Name cannot be blank")
    String name,

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email format")
    String email,

    @NotNull(message = "Age is required")
    @Min(value = 0, message = "Age must be positive")
    Integer age
) {}
```

### C. Services & Transactions
- Annotate service classes or transactional methods with `@Transactional` (`readOnly = true` for read operations to optimize Hibernate session management).
- Prefer constructor injection via Lombok `@RequiredArgsConstructor` over `@Autowired` field injection.

### D. Spring Data JPA & Hibernate Optimization
- Avoid the **N+1 query problem**: Use `@EntityGraph` or `JOIN FETCH` queries in repositories for fetching relationships.
- Use pagination (`Pageable`, `Page<T>`) for collection queries.
- Avoid bi-directional cascades unless necessary; set orphan removal cautiously.

```java
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("SELECT a FROM Appointment a JOIN FETCH a.patient JOIN FETCH a.doctor WHERE a.status = :status")
    List<Appointment> findAllWithDetailsByStatus(@Param("status") AppointmentStatus status);
}
```

### E. Centralized Global Exception Handling
Implement `@RestControllerAdvice` to transform domain and validation exceptions into standardized API error responses.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage(),
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.badRequest().body(errors);
    }
}
```
