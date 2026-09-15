package com.rtca.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SendChatRequestPayload {

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    @NotBlank(message = "Private chat key / passcode is required")
    private String passcode;

    public SendChatRequestPayload() {
    }

    public SendChatRequestPayload(Long receiverId, String passcode) {
        this.receiverId = receiverId;
        this.passcode = passcode;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }

    public String getPasscode() {
        return passcode;
    }

    public void setPasscode(String passcode) {
        this.passcode = passcode;
    }
}
