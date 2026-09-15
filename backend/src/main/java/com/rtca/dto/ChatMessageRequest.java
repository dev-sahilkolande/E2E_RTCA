package com.rtca.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ChatMessageRequest {

    @NotNull(message = "Conversation ID is required")
    private Long conversationId;

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 5000, message = "Message content exceeds maximum length of 5000 characters")
    private String content;

    private String ciphertext;
    private String iv;
    private String signature;

    public ChatMessageRequest() {
    }

    public ChatMessageRequest(Long conversationId, String content) {
        this.conversationId = conversationId;
        this.content = content;
    }

    public ChatMessageRequest(Long conversationId, String content, String ciphertext, String iv, String signature) {
        this.conversationId = conversationId;
        this.content = content;
        this.ciphertext = ciphertext;
        this.iv = iv;
        this.signature = signature;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCiphertext() {
        return ciphertext;
    }

    public void setCiphertext(String ciphertext) {
        this.ciphertext = ciphertext;
    }

    public String getIv() {
        return iv;
    }

    public void setIv(String iv) {
        this.iv = iv;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }
}
