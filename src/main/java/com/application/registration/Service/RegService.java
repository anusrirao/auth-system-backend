package com.application.registration.Service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import com.application.registration.DTO.LoginRequest;
import com.application.registration.DTO.RegisterRequest;
import com.application.registration.Repo.RegRepo;
import com.application.registration.model.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RegService 
{
	@Autowired
	private RegRepo repo;
//	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
	
	@Autowired
	private BCryptPasswordEncoder passwordEncoder;

    public String register(RegisterRequest request) {

        if (repo.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setFirstname(request.getFirstName());
        user.setLastname(request.getLastName());
        user.setEmail(request.getEmail());
        user.setMobile(request.getMobile());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        repo.save(user);

        return "User Registered Successfully";
    }

    public String login(LoginRequest request) {

//        User user = repo.findByEmail(request.getEmail());
//                .orElseThrow(() -> new RuntimeException("User not found"));

//    	 Optional<User> userOptional =
//    	            repo.findByEmail(request.getEmail());
    	
    	 Optional<User> userOptional =
    	            repo.findByEmailOrMobile(
    	                    request.getEmailOrPhone(),
    	                    request.getEmailOrPhone()
    	            );

    	    if (userOptional.isEmpty()) {
    	        return "User not found";
    	    }

    	    User user = userOptional.get();
    	
    	
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return "Login Successful";
    }
}
