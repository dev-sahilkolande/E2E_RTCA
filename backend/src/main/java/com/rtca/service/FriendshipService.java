package com.rtca.service;

import com.rtca.dto.FriendDto;
import com.rtca.model.Friendship;
import com.rtca.model.User;
import com.rtca.repository.FriendshipRepository;
import com.rtca.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    @Autowired
    public FriendshipService(FriendshipRepository friendshipRepository, UserRepository userRepository) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<FriendDto> getUserFriends(Long userId) {
        List<Friendship> friendships = friendshipRepository.findByUserIdOrderByIsStarredDescCreatedAtDesc(userId);
        return friendships.stream().map(FriendDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public void createMutualFriendship(Long userAId, Long userBId) {
        if (userAId.equals(userBId)) return;

        User userA = userRepository.findById(userAId).orElse(null);
        User userB = userRepository.findById(userBId).orElse(null);

        if (userA == null || userB == null) return;

        if (!friendshipRepository.existsByUserIdAndFriendId(userAId, userBId)) {
            friendshipRepository.save(new Friendship(userA, userB));
        }

        if (!friendshipRepository.existsByUserIdAndFriendId(userBId, userAId)) {
            friendshipRepository.save(new Friendship(userB, userA));
        }
    }

    @Transactional
    public boolean toggleStarFriend(Long userId, Long friendId) {
        Optional<Friendship> opt = friendshipRepository.findByUserIdAndFriendId(userId, friendId);
        if (opt.isEmpty()) {
            // Create friendship first if not existing
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found."));
            User friend = userRepository.findById(friendId)
                    .orElseThrow(() -> new IllegalArgumentException("Friend user not found."));
            Friendship f = new Friendship(user, friend);
            f.setStarred(true);
            friendshipRepository.save(f);
            return true;
        }

        Friendship friendship = opt.get();
        boolean newStarred = !friendship.isStarred();
        friendship.setStarred(newStarred);
        friendshipRepository.save(friendship);
        return newStarred;
    }

    @Transactional
    public void removeFriend(Long userId, Long friendId) {
        friendshipRepository.deleteByUserIdAndFriendId(userId, friendId);
        friendshipRepository.deleteByUserIdAndFriendId(friendId, userId);
    }
}
