package com.application.registration.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.application.registration.Repo.OtpRepo;
import com.application.registration.model.Otp;


@Service
public class OtpService {

    @Autowired
    private OtpRepo otpRepo;

    public String sendOtp(String mobile) {

        String generatedOtp = String.valueOf(100000 + new Random().nextInt(900000));

        Otp otp = new Otp();
        otp.setMobile(mobile);
        otp.setOtp(generatedOtp);
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(5));

        otpRepo.save(otp);

        // 🔥 Print OTP in console instead of sending SMS
        System.out.println("=================================");
        System.out.println("OTP for " + mobile + " is: " + generatedOtp);
        System.out.println("=================================");

        return "OTP sent successfully (Check backend console)";
    }

    public String verifyOtp(String mobile, String userOtp) {

        Optional<Otp> otpOptional = otpRepo.findTopByMobileOrderByExpiryTimeDesc(mobile);

        if (otpOptional.isEmpty()) {
            return "OTP not found";
        }

        Otp otp = otpOptional.get();

        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            return "OTP expired";
        }

        if (!otp.getOtp().equals(userOtp)) {
            return "Invalid OTP";
        }

        return "OTP Verified";
    }
}
