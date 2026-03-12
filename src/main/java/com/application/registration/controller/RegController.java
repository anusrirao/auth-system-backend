package com.application.registration.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.application.registration.DTO.LoginRequest;
import com.application.registration.DTO.RegisterRequest;
import com.application.registration.Service.RegService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/home")
public class RegController 
{
	@Autowired
	private RegService service;
	
	@PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        return service.register(request);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        return service.login(request);
    }
    
    @GetMapping("/test")
    public String test() {
        return "Backend Working!";
    }
}
