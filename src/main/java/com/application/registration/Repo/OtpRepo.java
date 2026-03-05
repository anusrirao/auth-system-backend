package com.application.registration.Repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.application.registration.model.Otp;

public interface OtpRepo extends JpaRepository<Otp, Long> {
    Optional<Otp> findTopByMobileOrderByExpiryTimeDesc(String mobile);
}