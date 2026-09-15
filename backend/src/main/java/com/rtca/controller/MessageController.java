package com.rtca.controller;

import com.rtca.dto.ApiResponse;
import com.rtca.dto.ChatMessageRequest;
import com.rtca.dto.ChatMessageResponse;
import com.rtca.security.UserPrincipal;
import com.rtca.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class MessageController {

    private final MessageService messageService;

    @Autowired
    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getConversationMessages(
            @PathVariable("id") Long conversationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<ChatMessageResponse> messages = messageService.getConversationMessages(conversationId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Message history retrieved successfully.", messages));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessageViaRest(
            @PathVariable("id") Long conversationId,
            @Valid @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        request.setConversationId(conversationId);
        ChatMessageResponse response = messageService.processAndSaveMessage(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully.", response));
    }
}
