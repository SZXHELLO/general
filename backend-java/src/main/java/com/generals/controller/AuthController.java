package com.generals.controller;

import com.generals.model.AuthRequest;
import com.generals.model.AuthResponse;
import com.generals.model.User;
import com.generals.service.JwtService;
import com.generals.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest request) {
        try {
            if (userService.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(false, "用户名已存在"));
            }

            User user = new User(request.getUsername(), request.getPassword());
            User savedUser = userService.save(user);

            String token = jwtService.generateToken(savedUser.getId(), savedUser.getUsername());

            AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                    savedUser.getId(), savedUser.getUsername());

            AuthResponse response = new AuthResponse(
                    true, "注册成功", token, userInfo);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new AuthResponse(false, "服务器错误"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        try {
            Optional<User> userOptional = userService.findByUsername(request.getUsername());
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(401)
                        .body(new AuthResponse(false, "用户名或密码错误"));
            }

            User user = userOptional.get();

            if (!userService.validatePassword(request.getPassword(), user.getPassword())) {
                return ResponseEntity.status(401)
                        .body(new AuthResponse(false, "用户名或密码错误"));
            }

            String token = jwtService.generateToken(user.getId(), user.getUsername());

            AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                    user.getId(), user.getUsername());

            AuthResponse response = new AuthResponse(
                    true, "登录成功", token, userInfo);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new AuthResponse(false, "服务器错误"));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verifyToken(@RequestBody VerifyRequest request) {
        try {
            if (request.getToken() == null || request.getToken().isEmpty()) {
                return ResponseEntity.status(401)
                        .body(new AuthResponse(false, "未提供令牌"));
            }

            if (!jwtService.validateToken(request.getToken())) {
                return ResponseEntity.status(401)
                        .body(new AuthResponse(false, "令牌无效"));
            }

            Long userId = jwtService.extractUserId(request.getToken());
            String username = jwtService.extractUsername(request.getToken());

            AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(userId, username);
            AuthResponse response = new AuthResponse(true, "令牌有效", null, userInfo);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(new AuthResponse(false, "令牌无效"));
        }
    }

    public static class VerifyRequest {
        private String token;
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }
}