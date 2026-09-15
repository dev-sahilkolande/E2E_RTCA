package com.rtca.dto;

import jakarta.validation.constraints.NotBlank;

public class PublicKeyRegisterRequest {

    @NotBlank(message = "Public ECDH Key is required")
    private String publicEcdhKey;

    @NotBlank(message = "Public ECDSA Key is required")
    private String publicEcdsaKey;

    public PublicKeyRegisterRequest() {
    }

    public PublicKeyRegisterRequest(String publicEcdhKey, String publicEcdsaKey) {
        this.publicEcdhKey = publicEcdhKey;
        this.publicEcdsaKey = publicEcdsaKey;
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
