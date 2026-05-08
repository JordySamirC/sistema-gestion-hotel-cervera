package com.hotel.cervera.hotel_cervera_api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.UUID;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resource, UUID id) {
        super(resource + " no encontrado con id: " + id);
    }

    public ResourceNotFoundException(String resource, String campo, String valor) {
        super(resource + " no encontrado con " + campo + ": " + valor);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
