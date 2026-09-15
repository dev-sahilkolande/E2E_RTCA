package com.rtca.dto;

import java.time.LocalDateTime;

public class NotificationEvent {
    private String type; // CHAT_REQUEST, NEW_MESSAGE
    private Long senderId;
    private String senderUsername;
    private Long conversationId;
    private String message;
    private LocalDateTime timestamp;

    public NotificationEvent() {
    }

    public NotificationEvent(String type, Long senderId, String senderUsername, Long conversationId, String message) {
        this.type = type;
        this.senderId = senderId;
        this.senderUsername = senderUsername;
        this.conversationId = conversationId;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderUsername() {
        return senderUsername;
    }

    public void setSenderUsername(String senderUsername) {
        this.senderUsername = senderUsername;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
