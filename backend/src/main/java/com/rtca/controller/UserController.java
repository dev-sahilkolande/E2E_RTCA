package com.rtca.controller;

import com.rtca.dto.ApiResponse;
import com.rtca.dto.UserDto;
import com.rtca.model.User;
import com.rtca.repository.UserRepository;
import com.rtca.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    @Autowired
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserDto>>> searchUsers(
            @RequestParam("query") String query,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success("Empty query", List.of()));
        }

        List<User> matchingUsers = userRepository.searchUsersExcludingCurrent(query.trim(), currentUser.getId());
        List<UserDto> dtos = matchingUsers.stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Search results retrieved.", dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable("id") Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        return ResponseEntity.ok(ApiResponse.success("User profile retrieved.", UserDto.fromEntity(user)));
    }
}
