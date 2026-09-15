package com.rtca.controller;

import com.rtca.dto.ApiResponse;
import com.rtca.dto.FriendDto;
import com.rtca.security.UserPrincipal;
import com.rtca.service.FriendshipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class FriendshipController {

    private final FriendshipService friendshipService;

    @Autowired
    public FriendshipController(FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FriendDto>>> getUserFriends(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<FriendDto> friends = friendshipService.getUserFriends(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Friends list retrieved successfully.", friends));
    }

    @PostMapping("/{friendId}/star")
    public ResponseEntity<ApiResponse<Boolean>> toggleStarFriend(
            @PathVariable("friendId") Long friendId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        boolean isStarred = friendshipService.toggleStarFriend(currentUser.getId(), friendId);
        String msg = isStarred ? "Friend starred as favorite!" : "Friend unstarred.";
        return ResponseEntity.ok(ApiResponse.success(msg, isStarred));
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<ApiResponse<Void>> removeFriend(
            @PathVariable("friendId") Long friendId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        friendshipService.removeFriend(currentUser.getId(), friendId);
        return ResponseEntity.ok(ApiResponse.success("Friend removed successfully.", null));
    }
}
