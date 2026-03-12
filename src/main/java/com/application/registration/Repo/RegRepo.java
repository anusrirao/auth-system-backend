package com.application.registration.Repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.application.registration.model.User;

@Repository
public interface RegRepo extends JpaRepository<User, Integer> 
{
	
	Optional<User> findByEmailOrMobile(String email, String mobile);
	Optional<User> findByEmail(String email);		
}
