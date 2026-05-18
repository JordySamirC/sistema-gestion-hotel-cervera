package com.hotel.cervera.hotel_cervera_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HotelCerveraApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(HotelCerveraApiApplication.class, args);
	}

}

