package com.rtca.controller;

import com.rtca.dto.ApiResponse;
import com.rtca.dto.ConversationDto;
import com.rtca.dto.CreateConversationRequest;
import com.rtca.security.UserPrincipal;
import com.rtca.service.ConversationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    @Autowired
    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConversationDto>> createOrGetConversation(
            @Valid @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ConversationDto dto = conversationService.getOrCreateConversation(currentUser.getId(), request.getTargetUserId());
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Conversation retrieved or created successfully.", dto));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getUserConversations(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<ConversationDto> conversations = conversationService.getUserConversations(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Conversations retrieved.", conversations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationDto>> getConversationById(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ConversationDto dto = conversationService.getConversationById(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Conversation metadata retrieved.", dto));
    }
}
