package com.rtca.model;

import jakarta.persistence.*;
import org.springframework.data.domain.Persistable;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_public_keys")
public class UserPublicKey implements Persistable<Long> {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "public_ecdh_key", nullable = false, columnDefinition = "TEXT")
    private String publicEcdhKey;

    @Column(name = "public_ecdsa_key", nullable = false, columnDefinition = "TEXT")
    private String publicEcdsaKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Transient
    private boolean isNewEntity = true;

    public UserPublicKey() {
    }

    public UserPublicKey(User user, String publicEcdhKey, String publicEcdsaKey) {
        this.user = user;
        if (user != null) {
            this.userId = user.getId();
        }
        this.publicEcdhKey = publicEcdhKey;
        this.publicEcdsaKey = publicEcdsaKey;
    }

    @Override
    public Long getId() {
        return userId;
    }

    @Override
    public boolean isNew() {
        return isNewEntity;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @PostLoad
    @PostPersist
    protected void markNotNew() {
        this.isNewEntity = false;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
        if (user != null && this.userId == null) {
            this.userId = user.getId();
        }
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
