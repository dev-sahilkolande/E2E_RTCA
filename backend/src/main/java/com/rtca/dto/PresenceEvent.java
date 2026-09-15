package com.rtca.dto;

public class PresenceEvent {

    private Long userId;
    private String username;
    private String status; // "ONLINE" or "OFFLINE"

    public PresenceEvent() {
    }

    public PresenceEvent(Long userId, String username, String status) {
        this.userId = userId;
        this.username = username;
        this.status = status;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
