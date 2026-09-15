package com.rtca.service;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserPresenceService {

    // Maps userId -> Set of STOMP Session IDs
    private final ConcurrentHashMap<Long, Set<String>> userSessions = new ConcurrentHashMap<>();

    public boolean userConnected(Long userId, String sessionId) {
        userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
        // Returns true if this is the first active connection for this user
        return userSessions.get(userId).size() == 1;
    }

    public boolean userDisconnected(Long userId, String sessionId) {
        Set<String> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
                return true; // User is now fully offline across all tabs
            }
        }
        return false;
    }

    public boolean isUserOnline(Long userId) {
        Set<String> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    public Set<Long> getOnlineUserIds() {
        return Collections.unmodifiableSet(userSessions.keySet());
    }
}
