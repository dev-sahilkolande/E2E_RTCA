package com.rtca.controller;

import com.rtca.dto.ChatMessageRequest;
import com.rtca.dto.ChatMessageResponse;
import com.rtca.dto.NotificationEvent;
import com.rtca.dto.TypingEvent;
import com.rtca.model.ConversationParticipant;
import com.rtca.repository.ConversationParticipantRepository;
import com.rtca.security.UserPrincipal;
import com.rtca.service.MessageService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;

@Controller
public class ChatWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(ChatWebSocketController.class);

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationParticipantRepository participantRepository;

    @Autowired
    public ChatWebSocketController(MessageService messageService,
                                  SimpMessagingTemplate messagingTemplate,
                                  ConversationParticipantRepository participantRepository) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
        this.participantRepository = participantRepository;
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Valid @Payload ChatMessageRequest request, Principal principal) {
        if (principal == null) {
            logger.error("STOMP message rejected: Principal is unauthenticated.");
            return;
        }

        UserPrincipal currentUser = null;
        if (principal instanceof UsernamePasswordAuthenticationToken token) {
            currentUser = (UserPrincipal) token.getPrincipal();
        }

        if (currentUser == null) {
            logger.error("STOMP message rejected: Could not extract UserPrincipal.");
            return;
        }

        try {
            // Sender identity comes ONLY from authenticated principal
            ChatMessageResponse response = messageService.processAndSaveMessage(currentUser.getId(), request);

            // Broadcast message to all subscribed participants of this conversation topic
            String destination = "/topic/conversation." + response.getConversationId();
            messagingTemplate.convertAndSend(destination, response);

            // Dispatch notification alert to other participants (shows who sent message and when)
            List<ConversationParticipant> participants = participantRepository.findByConversationId(response.getConversationId());
            for (ConversationParticipant p : participants) {
                Long pId = p.getUser().getId();
                if (!pId.equals(currentUser.getId())) {
                    NotificationEvent notification = new NotificationEvent(
                            "NEW_MESSAGE",
                            currentUser.getId(),
                            currentUser.getUsername(),
                            response.getConversationId(),
                            "New message from " + currentUser.getUsername()
                    );
                    messagingTemplate.convertAndSend("/topic/user." + pId + ".notifications", notification);
                }
            }

            logger.info("Real-time message delivered to STOMP destination: {}", destination);
        } catch (Exception e) {
            logger.error("Failed to process and deliver real-time STOMP message: {}", e.getMessage());
        }
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingEvent event, Principal principal) {
        if (principal == null || event.getConversationId() == null) return;

        UserPrincipal currentUser = null;
        if (principal instanceof UsernamePasswordAuthenticationToken token) {
            currentUser = (UserPrincipal) token.getPrincipal();
        }

        if (currentUser == null) return;

        event.setUserId(currentUser.getId());
        event.setUsername(currentUser.getUsername());

        String destination = "/topic/conversation." + event.getConversationId() + ".typing";
        messagingTemplate.convertAndSend(destination, event);
    }
}
