package com.rtca.dto;

import com.rtca.model.Message;

import java.time.LocalDateTime;

public class ChatMessageResponse {

    private Long id;
    private Long conversationId;
    private UserDto sender;
    private String content;
    private LocalDateTime createdAt;
    private String status = "confirmed";

    public ChatMessageResponse() {
    }

    public ChatMessageResponse(Long id, Long conversationId, UserDto sender, String content, LocalDateTime createdAt) {
        this.id = id;
        this.conversationId = conversationId;
        this.sender = sender;
        this.content = content;
        this.createdAt = createdAt;
    }

    public static ChatMessageResponse fromEntity(Message message) {
        if (message == null) return null;
        return new ChatMessageResponse(
                message.getId(),
                message.getConversation().getId(),
                UserDto.fromEntity(message.getSender()),
                message.getContent(),
                message.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public UserDto getSender() {
        return sender;
    }

    public void setSender(UserDto sender) {
        this.sender = sender;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
