package com.hotel.cervera.hotel_cervera_api.service;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import org.springframework.stereotype.Service;

@Service
public class PhoneValidationService {

    private final PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();

    public String normalizeToE164(String phone, String isoCountry) {
        if (phone == null || phone.isBlank()) return phone;
        try {
            PhoneNumber number;
            if (phone.startsWith("+")) {
                number = phoneUtil.parse(phone, null);
            } else if (isoCountry != null && !isoCountry.isBlank()) {
                number = phoneUtil.parse(phone, isoCountry);
            } else {
                return phone;
            }
            if (phoneUtil.isValidNumber(number)) {
                return phoneUtil.format(number, PhoneNumberUtil.PhoneNumberFormat.E164);
            }
            return phone;
        } catch (NumberParseException e) {
            return phone;
        }
    }

    public boolean isValid(String phone, String isoCountry) {
        if (phone == null || phone.isBlank()) return false;
        try {
            PhoneNumber number;
            if (phone.startsWith("+")) {
                number = phoneUtil.parse(phone, null);
            } else if (isoCountry != null && !isoCountry.isBlank()) {
                number = phoneUtil.parse(phone, isoCountry);
            } else {
                return false;
            }
            return phoneUtil.isValidNumber(number);
        } catch (NumberParseException e) {
            return false;
        }
    }
}
