package com.rtca.controller;

import com.rtca.dto.ApiResponse;
import com.rtca.service.UserPresenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/presence")
public class UserPresenceController {

    private final UserPresenceService presenceService;

    @Autowired
    public UserPresenceController(UserPresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Set<Long>>> getOnlineUsers() {
        Set<Long> onlineUsers = presenceService.getOnlineUserIds();
        return ResponseEntity.ok(ApiResponse.success("Online users retrieved.", onlineUsers));
    }
}
