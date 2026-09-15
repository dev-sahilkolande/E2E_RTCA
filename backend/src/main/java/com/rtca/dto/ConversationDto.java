package com.rtca.dto;

import com.rtca.model.Conversation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class ConversationDto {
    private Long id;
    private String userPairKey;
    private List<UserDto> participants;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ConversationDto() {
    }

    public ConversationDto(Long id, String userPairKey, List<UserDto> participants, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userPairKey = userPairKey;
        this.participants = participants;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ConversationDto fromEntity(Conversation conversation) {
        if (conversation == null) return null;

        List<UserDto> participantDtos = conversation.getParticipants().stream()
                .map(p -> UserDto.fromEntity(p.getUser()))
                .collect(Collectors.toList());

        return new ConversationDto(
                conversation.getId(),
                conversation.getUserPairKey(),
                participantDtos,
                conversation.getCreatedAt(),
                conversation.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserPairKey() {
        return userPairKey;
    }

    public void setUserPairKey(String userPairKey) {
        this.userPairKey = userPairKey;
    }

    public List<UserDto> getParticipants() {
        return participants;
    }

    public void setParticipants(List<UserDto> participants) {
        this.participants = participants;
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
