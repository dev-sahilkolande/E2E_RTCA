package com.rtca.dto;

import com.rtca.model.Friendship;
import java.time.LocalDateTime;

public class FriendDto {
    private Long id;
    private UserDto friend;
    private boolean isStarred;
    private LocalDateTime createdAt;

    public FriendDto() {
    }

    public FriendDto(Long id, UserDto friend, boolean isStarred, LocalDateTime createdAt) {
        this.id = id;
        this.friend = friend;
        this.isStarred = isStarred;
        this.createdAt = createdAt;
    }

    public static FriendDto fromEntity(Friendship friendship) {
        if (friendship == null) return null;
        return new FriendDto(
                friendship.getId(),
                UserDto.fromEntity(friendship.getFriend()),
                friendship.isStarred(),
                friendship.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserDto getFriend() {
        return friend;
    }

    public void setFriend(UserDto friend) {
        this.friend = friend;
    }

    public boolean isStarred() {
        return isStarred;
    }

    public void setStarred(boolean starred) {
        isStarred = starred;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
