package com.rtca.service;

import com.rtca.dto.ConversationDto;
import com.rtca.model.Conversation;
import com.rtca.model.ConversationParticipant;
import com.rtca.model.User;
import com.rtca.repository.ConversationParticipantRepository;
import com.rtca.repository.ConversationRepository;
import com.rtca.repository.UserRepository;
import com.rtca.util.UserPairKeyUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;

    @Autowired
    public ConversationService(ConversationRepository conversationRepository,
                               ConversationParticipantRepository participantRepository,
                               UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ConversationDto getOrCreateConversation(Long currentUserId, Long targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot create a conversation with yourself.");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Current user identity not found."));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user identity not found with ID: " + targetUserId));

        String pairKey = UserPairKeyUtil.generatePairKey(currentUserId, targetUserId);

        Optional<Conversation> existingOpt = conversationRepository.findByUserPairKey(pairKey);
        if (existingOpt.isPresent()) {
            return ConversationDto.fromEntity(existingOpt.get());
        }

        // Create new direct conversation and attach bidirectional participants
        Conversation conversation = new Conversation(pairKey);
        ConversationParticipant cp1 = new ConversationParticipant(conversation, currentUser);
        ConversationParticipant cp2 = new ConversationParticipant(conversation, targetUser);

        conversation.getParticipants().add(cp1);
        conversation.getParticipants().add(cp2);

        Conversation savedConversation = conversationRepository.save(conversation);
        return ConversationDto.fromEntity(savedConversation);
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getUserConversations(Long currentUserId) {
        List<Conversation> conversations = conversationRepository.findConversationsByUserId(currentUserId);
        return conversations.stream()
                .map(ConversationDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationDto getConversationById(Long conversationId, Long currentUserId) {
        boolean isParticipant = participantRepository.existsByConversationIdAndUserId(conversationId, currentUserId);
        if (!isParticipant) {
            throw new IllegalArgumentException("Access Denied: You are not authorized to view this private conversation.");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found with ID: " + conversationId));

        return ConversationDto.fromEntity(conversation);
    }
}
