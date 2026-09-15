package com.rtca.service;

import com.rtca.dto.ChatMessageRequest;
import com.rtca.dto.ChatMessageResponse;
import com.rtca.model.Conversation;
import com.rtca.model.Message;
import com.rtca.model.User;
import com.rtca.repository.ConversationParticipantRepository;
import com.rtca.repository.ConversationRepository;
import com.rtca.repository.MessageRepository;
import com.rtca.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;

    @Autowired
    public MessageService(MessageRepository messageRepository,
                          ConversationRepository conversationRepository,
                          ConversationParticipantRepository participantRepository,
                          UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChatMessageResponse processAndSaveMessage(Long senderId, ChatMessageRequest request) {
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty.");
        }

        if (request.getContent().length() > 5000) {
            throw new IllegalArgumentException("Message content exceeds maximum allowed length of 5000 characters.");
        }

        boolean isParticipant = participantRepository.existsByConversationIdAndUserId(request.getConversationId(), senderId);
        if (!isParticipant) {
            throw new IllegalArgumentException("Access Denied: Sender is not a participant of this conversation.");
        }

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found with ID: " + request.getConversationId()));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender identity not found with ID: " + senderId));

        Message message = new Message(conversation, sender, request.getContent().trim());
        Message savedMessage = messageRepository.save(message);

        // Update conversation timestamp
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return ChatMessageResponse.fromEntity(savedMessage);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getConversationMessages(Long conversationId, Long currentUserId) {
        boolean isParticipant = participantRepository.existsByConversationIdAndUserId(conversationId, currentUserId);
        if (!isParticipant) {
            throw new IllegalArgumentException("Access Denied: You are not authorized to view messages from this conversation.");
        }

        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        return messages.stream()
                .map(ChatMessageResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
