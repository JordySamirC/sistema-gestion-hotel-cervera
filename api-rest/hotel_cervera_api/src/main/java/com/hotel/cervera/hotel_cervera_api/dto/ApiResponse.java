package com.hotel.cervera.hotel_cervera_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse {

    private boolean success;
    private String message;
    private Object data;

    @Builder.Default
    private OffsetDateTime timestamp = OffsetDateTime.now();

    public static ApiResponse ok(String message) {
        return ApiResponse.builder().success(true).message(message).build();
    }

    public static ApiResponse ok(String message, Object data) {
        return ApiResponse.builder().success(true).message(message).data(data).build();
    }

    public static ApiResponse error(String message) {
        return ApiResponse.builder().success(false).message(message).build();
    }
}
