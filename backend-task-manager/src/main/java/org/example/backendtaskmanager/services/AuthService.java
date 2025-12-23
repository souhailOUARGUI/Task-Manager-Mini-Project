package org.example.backendtaskmanager.services;


import lombok.RequiredArgsConstructor;
import org.example.backendtaskmanager.dtos.LoginRequest;
import org.example.backendtaskmanager.dtos.LoginResponse;
import org.example.backendtaskmanager.dtos.RegisterRequest;
import org.example.backendtaskmanager.entities.User;
import org.example.backendtaskmanager.exceptions.BadRequestException;
import org.example.backendtaskmanager.repositories.UserRepository;
import org.example.backendtaskmanager.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        // 1. Trigger Spring Security authentication
         authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Generate Token
        String token = tokenProvider.generateToken(request.getEmail());

        // 3. Retrieve User details
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        return new LoginResponse(token, user.getEmail(), user.getName());
    }

}
