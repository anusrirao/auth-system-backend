package com.application.registration.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.application.registration.DTO.OtpRequest;
import com.application.registration.DTO.OtpVerifyRequest;
import com.application.registration.Service.OtpService;



@RestController
@RequestMapping("/otp")
@CrossOrigin(origins = "http://localhost:5173")
public class OtpController {

    @Autowired
    private OtpService otpService;

    @PostMapping("/send")
    public String sendOtp(@RequestBody OtpRequest request) {
        return otpService.sendOtp(request.getMobile());
    }

    @PostMapping("/verify")
    public String verifyOtp(@RequestBody OtpVerifyRequest request) {
        return otpService.verifyOtp(request.getMobile(), request.getOtp());
    }
}