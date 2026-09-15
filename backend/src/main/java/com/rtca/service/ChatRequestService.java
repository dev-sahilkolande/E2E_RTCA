package com.rtca.service;

import com.rtca.dto.ChatRequestDto;
import com.rtca.dto.ConversationDto;
import com.rtca.dto.NotificationEvent;
import com.rtca.dto.SendChatRequestPayload;
import com.rtca.model.ChatRequest;
import com.rtca.model.User;
import com.rtca.repository.ChatRequestRepository;
import com.rtca.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatRequestService {

    private final ChatRequestRepository chatRequestRepository;
    private final UserRepository userRepository;
    private final ConversationService conversationService;
    private final PasswordEncoder passwordEncoder;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public ChatRequestService(ChatRequestRepository chatRequestRepository,
                              UserRepository userRepository,
                              ConversationService conversationService,
                              PasswordEncoder passwordEncoder,
                              SimpMessagingTemplate messagingTemplate) {
        this.chatRequestRepository = chatRequestRepository;
        this.userRepository = userRepository;
        this.conversationService = conversationService;
        this.passwordEncoder = passwordEncoder;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public ChatRequestDto sendChatRequest(Long senderId, SendChatRequestPayload payload) {
        if (senderId.equals(payload.getReceiverId())) {
            throw new IllegalArgumentException("You cannot send a chat request to yourself.");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found."));
        User receiver = userRepository.findById(payload.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver user not found."));

        // Check for existing pending request
        if (chatRequestRepository.existsBySenderIdAndReceiverIdAndStatus(senderId, payload.getReceiverId(), "PENDING")) {
            throw new IllegalArgumentException("A pending chat request already exists for this user.");
        }

        String passcodeHash = passwordEncoder.encode(payload.getPasscode().trim());
        ChatRequest chatRequest = new ChatRequest(sender, receiver, passcodeHash);
        ChatRequest saved = chatRequestRepository.save(chatRequest);

        // Send real-time notification to receiver
        NotificationEvent notification = new NotificationEvent(
                "CHAT_REQUEST",
                sender.getId(),
                sender.getUsername(),
                null,
                sender.getUsername() + " sent you a private chat request."
        );
        messagingTemplate.convertAndSend("/topic/user." + receiver.getId() + ".notifications", notification);

        return ChatRequestDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ChatRequestDto> getPendingRequests(Long userId) {
        List<ChatRequest> requests = chatRequestRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(userId, "PENDING");
        return requests.stream().map(ChatRequestDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public ConversationDto acceptChatRequest(Long receiverId, Long requestId, String passcode) {
        ChatRequest chatRequest = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Chat request not found."));

        if (!chatRequest.getReceiver().getId().equals(receiverId)) {
            throw new IllegalArgumentException("Access Denied: You are not authorized to accept this chat request.");
        }

        if (!"PENDING".equalsIgnoreCase(chatRequest.getStatus())) {
            throw new IllegalArgumentException("Chat request is no longer pending.");
        }

        if (passcode == null || !passwordEncoder.matches(passcode.trim(), chatRequest.getPasscodeHash())) {
            throw new IllegalArgumentException("Invalid Private Chat Key. Please check the passcode and try again.");
        }

        chatRequest.setStatus("ACCEPTED");
        chatRequestRepository.save(chatRequest);

        // Create 1-on-1 Conversation between sender and receiver
        ConversationDto conversation = conversationService.getOrCreateConversation(receiverId, chatRequest.getSender().getId());

        // Send real-time notification to sender
        NotificationEvent notification = new NotificationEvent(
                "CHAT_REQUEST_ACCEPTED",
                chatRequest.getReceiver().getId(),
                chatRequest.getReceiver().getUsername(),
                conversation.getId(),
                chatRequest.getReceiver().getUsername() + " accepted your chat request!"
        );
        messagingTemplate.convertAndSend("/topic/user." + chatRequest.getSender().getId() + ".notifications", notification);

        return conversation;
    }

    @Transactional
    public void rejectChatRequest(Long receiverId, Long requestId) {
        ChatRequest chatRequest = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Chat request not found."));

        if (!chatRequest.getReceiver().getId().equals(receiverId)) {
            throw new IllegalArgumentException("Access Denied: You are not authorized to reject this chat request.");
        }

        chatRequest.setStatus("REJECTED");
        chatRequestRepository.save(chatRequest);
    }
}
