package com.rtca.dto;

import com.rtca.model.ChatRequest;
import java.time.LocalDateTime;

public class ChatRequestDto {
    private Long id;
    private UserDto sender;
    private UserDto receiver;
    private String status;
    private LocalDateTime createdAt;

    public ChatRequestDto() {
    }

    public ChatRequestDto(Long id, UserDto sender, UserDto receiver, String status, LocalDateTime createdAt) {
        this.id = id;
        this.sender = sender;
        this.receiver = receiver;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static ChatRequestDto fromEntity(ChatRequest request) {
        if (request == null) return null;
        return new ChatRequestDto(
                request.getId(),
                UserDto.fromEntity(request.getSender()),
                UserDto.fromEntity(request.getReceiver()),
                request.getStatus(),
                request.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserDto getSender() {
        return sender;
    }

    public void setSender(UserDto sender) {
        this.sender = sender;
    }

    public UserDto getReceiver() {
        return receiver;
    }

    public void setReceiver(UserDto receiver) {
        this.receiver = receiver;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
