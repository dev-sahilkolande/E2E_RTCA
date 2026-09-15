package com.rtca.controller;

import com.rtca.dto.*;
import com.rtca.security.UserPrincipal;
import com.rtca.service.ChatRequestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat-requests")
public class ChatRequestController {

    private final ChatRequestService chatRequestService;

    @Autowired
    public ChatRequestController(ChatRequestService chatRequestService) {
        this.chatRequestService = chatRequestService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ChatRequestDto>> sendChatRequest(
            @Valid @RequestBody SendChatRequestPayload payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ChatRequestDto requestDto = chatRequestService.sendChatRequest(currentUser.getId(), payload);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chat request sent successfully.", requestDto));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<ChatRequestDto>>> getPendingRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<ChatRequestDto> requests = chatRequestService.getPendingRequests(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Pending chat requests retrieved successfully.", requests));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<ConversationDto>> acceptChatRequest(
            @PathVariable("id") Long requestId,
            @Valid @RequestBody AcceptChatRequestPayload payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ConversationDto conversation = chatRequestService.acceptChatRequest(currentUser.getId(), requestId, payload.getPasscode());
        return ResponseEntity.ok(ApiResponse.success("Chat request accepted successfully!", conversation));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<String>> rejectChatRequest(
            @PathVariable("id") Long requestId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        chatRequestService.rejectChatRequest(currentUser.getId(), requestId);
        return ResponseEntity.ok(ApiResponse.success("Chat request rejected.", null));
    }
}
