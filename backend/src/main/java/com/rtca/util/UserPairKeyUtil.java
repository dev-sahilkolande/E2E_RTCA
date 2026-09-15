package com.rtca.util;

public class UserPairKeyUtil {

    private UserPairKeyUtil() {
    }

    /**
     * Generates a deterministic canonical pair key for two user IDs.
     * Ensures that order of parameters doesn't change the key.
     * e.g., (12, 34) and (34, 12) both produce "12_34"
     */
    public static String generatePairKey(Long userId1, Long userId2) {
        if (userId1 == null || userId2 == null) {
            throw new IllegalArgumentException("User IDs cannot be null for pair key generation.");
        }
        if (userId1.equals(userId2)) {
            throw new IllegalArgumentException("User cannot create a 1-to-1 conversation with themselves.");
        }
        long min = Math.min(userId1, userId2);
        long max = Math.max(userId1, userId2);
        return min + "_" + max;
    }
}
