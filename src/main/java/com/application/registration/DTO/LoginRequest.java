package com.application.registration.DTO;

import lombok.Data;

@Data
public class LoginRequest {
	
	private String emailOrPhone;
	public String getEmailOrPhone() {
		return emailOrPhone;
	}
	public void setEmailOrPhone(String emailOrPhone) {
		this.emailOrPhone = emailOrPhone;
	}
	
	
//	private String email;
//	public String getEmail() {
//		return email;
//	}
//	public void setEmail(String email) {
//		this.email = email;
//	}
	
	
	private String password;
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	

//	 private String emailOrPhone;
//	 private String password;
//	 
//	 public String getEmailOrPhone() {
//		 return emailOrPhone;
//	 }
//	 public void setEmailOrPhone(String emailOrPhone) {
//		 this.emailOrPhone = emailOrPhone;
//	 }
//	 public String getPassword() {
//		 return password;
//	 }
//	 public void setPassword(String password) {
//		 this.password = password;
//	 }
//	 
	 
}
