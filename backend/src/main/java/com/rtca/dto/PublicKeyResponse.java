package com.rtca.dto;

import com.rtca.model.UserPublicKey;

public class PublicKeyResponse {
    private Long userId;
    private String publicEcdhKey;
    private String publicEcdsaKey;

    public PublicKeyResponse() {
    }

    public PublicKeyResponse(Long userId, String publicEcdhKey, String publicEcdsaKey) {
        this.userId = userId;
        this.publicEcdhKey = publicEcdhKey;
        this.publicEcdsaKey = publicEcdsaKey;
    }

    public static PublicKeyResponse fromEntity(UserPublicKey entity) {
        if (entity == null) return null;
        return new PublicKeyResponse(entity.getUserId(), entity.getPublicEcdhKey(), entity.getPublicEcdsaKey());
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getPublicEcdhKey() {
        return publicEcdhKey;
    }

    public void setPublicEcdhKey(String publicEcdhKey) {
        this.publicEcdhKey = publicEcdhKey;
    }

    public String getPublicEcdsaKey() {
        return publicEcdsaKey;
    }

    public void setPublicEcdsaKey(String publicEcdsaKey) {
        this.publicEcdsaKey = publicEcdsaKey;
    }
}
