package com.agenda.api.exception;

import com.agenda.api.security.MdcFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.security.core.AuthenticationException;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleAllExceptions(Exception ex, HttpServletRequest request) {
        String traceId = MDC.get(MdcFilter.TRACE_ID_KEY);
        
        // Log the full stack trace internally for monitoring (e.g. Sentry/Datadog)
        logger.error("Internal Server Error [traceId={}]: {}", traceId, ex.getMessage(), ex);

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "Ocorreu um erro interno. Por favor, tente novamente mais tarde.",
                request.getRequestURI(),
                traceId
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex, HttpServletRequest request) {
        String traceId = MDC.get(MdcFilter.TRACE_ID_KEY);
        logger.warn("Bad Request [traceId={}]: {}", traceId, ex.getMessage());

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                ex.getMessage(),
                request.getRequestURI(),
                traceId
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessException(BusinessException ex, HttpServletRequest request) {
        String traceId = MDC.get(MdcFilter.TRACE_ID_KEY);
        logger.warn("Business Exception [traceId={}]: {}", traceId, ex.getMessage());

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.UNPROCESSABLE_ENTITY.value(),
                "Unprocessable Entity",
                ex.getMessage(),
                request.getRequestURI(),
                traceId
        );
        return new ResponseEntity<>(error, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex, HttpServletRequest request) {
        String traceId = MDC.get(MdcFilter.TRACE_ID_KEY);
        logger.warn("Resource Not Found [traceId={}]: {}", traceId, ex.getMessage());

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage(),
                request.getRequestURI(),
                traceId
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(AuthenticationException ex, HttpServletRequest request) {
        String traceId = MDC.get(MdcFilter.TRACE_ID_KEY);
        logger.warn("Authentication Failed [traceId={}]: {}", traceId, ex.getMessage());

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Forbidden",
                "E-mail ou senha incorretos.",
                request.getRequestURI(),
                traceId
        );
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String traceId = MDC.get(MdcFilter.TRACE_ID_KEY);
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fieldError -> 
                errors.put(fieldError.getField(), fieldError.getDefaultMessage())
        );

        logger.warn("Validation Error [traceId={}]: {}", traceId, errors);

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Validation Error",
                "Falha na validação dos campos.",
                request.getRequestURI(),
                traceId,
                errors
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolationException(DataIntegrityViolationException ex, HttpServletRequest request) {
        String traceId = MDC.get(MdcFilter.TRACE_ID_KEY);
        
        String messageDetail = ex.getMostSpecificCause().getMessage();
        logger.warn("Data Integrity Violation [traceId={}]: {}", traceId, messageDetail);

        if (messageDetail != null && messageDetail.toLowerCase().contains("email")) {
            Map<String, String> errors = new HashMap<>();
            errors.put("adminEmail", "Este e-mail já está em uso.");
            
            ApiErrorResponse error = new ApiErrorResponse(
                    HttpStatus.BAD_REQUEST.value(),
                    "Validation Error",
                    "Falha na validação dos campos.",
                    request.getRequestURI(),
                    traceId,
                    errors
            );
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.CONFLICT.value(),
                "Conflict",
                "Ocorreu um erro de integridade de dados (ex: registro duplicado).",
                request.getRequestURI(),
                traceId
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }
}
