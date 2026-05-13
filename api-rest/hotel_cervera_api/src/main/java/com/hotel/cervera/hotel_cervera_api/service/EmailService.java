package com.hotel.cervera.hotel_cervera_api.service;

public interface EmailService {
    void sendMagicLink(String to, String magicLink);
}
