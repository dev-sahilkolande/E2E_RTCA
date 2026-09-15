package com.rtca.security;

import com.rtca.dto.PresenceEvent;
import com.rtca.service.UserPresenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final UserPresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WebSocketEventListener(UserPresenceService presenceService, SimpMessagingTemplate messagingTemplate) {
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();

        if (principal instanceof UsernamePasswordAuthenticationToken token && token.getPrincipal() instanceof UserPrincipal userPrincipal) {
            String sessionId = headerAccessor.getSessionId();
            boolean becameOnline = presenceService.userConnected(userPrincipal.getId(), sessionId);

            if (becameOnline) {
                logger.info("User connected and online: {} (ID: {})", userPrincipal.getUsername(), userPrincipal.getId());
                messagingTemplate.convertAndSend("/topic/presence", new PresenceEvent(userPrincipal.getId(), userPrincipal.getUsername(), "ONLINE"));
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();

        if (principal instanceof UsernamePasswordAuthenticationToken token && token.getPrincipal() instanceof UserPrincipal userPrincipal) {
            String sessionId = headerAccessor.getSessionId();
            boolean becameOffline = presenceService.userDisconnected(userPrincipal.getId(), sessionId);

            if (becameOffline) {
                logger.info("User disconnected and offline: {} (ID: {})", userPrincipal.getUsername(), userPrincipal.getId());
                messagingTemplate.convertAndSend("/topic/presence", new PresenceEvent(userPrincipal.getId(), userPrincipal.getUsername(), "OFFLINE"));
            }
        }
    }
}
