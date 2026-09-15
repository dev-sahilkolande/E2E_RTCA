package com.rtca.dto;

import jakarta.validation.constraints.NotBlank;

public class AcceptChatRequestPayload {

    @NotBlank(message = "Private chat key / passcode is required")
    private String passcode;

    public AcceptChatRequestPayload() {
    }

    public AcceptChatRequestPayload(String passcode) {
        this.passcode = passcode;
    }

    public String getPasscode() {
        return passcode;
    }

    public void setPasscode(String passcode) {
        this.passcode = passcode;
    }
}
