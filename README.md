# Real-Time Chat Application

A secure, direct one-to-one real-time web chat application built with **React**, **Java / Spring Boot**, **Spring Security + JWT**, **WebSocket + STOMP**, and **MySQL with Spring Data JPA**.

---

## Architecture Overview

```
+-----------------------------------------------------------------------+
|                            React Frontend                             |
|    (Vite SPA, Glassmorphism UI, Axios REST Client, STOMP WS Client)   |
+-----------------------------------------------------------------------+
            |                                         ^
     REST APIs (JWT)                           WebSocket (STOMP)
            |                                         |
+-----------------------------------------------------------------------+
|                         Spring Boot Backend                           |
|  - Spring Security + JWT Authentication Filter                        |
|  - REST Controllers (Auth, User Search, Conversations, History)       |
|  - STOMP WebSocket Controller (/app/chat.sendMessage -> /topic)       |
|  - Spring Data JPA Repository Layer                                   |
+-----------------------------------------------------------------------+
                                    |
                            MySQL Database
                  (Users, Conversations, Participants, Messages)
```

---

## Core Features & Capabilities

- **User Authentication & Security**:
  - Secure registration and login with BCrypt password hashing.
  - Stateless JSON Web Token (JWT) issuing and validation via `Authorization: Bearer <token>`.
  - Sensitive field protection: Passwords are strictly excluded (`@JsonIgnore`) from API payloads and DTOs.
- **User Discovery & 1-on-1 Chat**:
  - Search registered users by username or email.
  - Automatic direct conversation creation with database-enforced canonical pair key (`min_userId_max_userId`), preventing duplicate chats between the same two users.
- **Real-Time Messaging**:
  - WebSocket & STOMP protocol message delivery over `/ws`.
  - STOMP connection frame JWT authentication via `StompAuthChannelInterceptor`.
  - Real-time message broadcasting to `/topic/conversation.{id}` without page refresh.
  - Server-enforced identity: Message sender identity is derived strictly from the authenticated JWT principal.
- **Persistent Chat History**:
  - Messages persisted in MySQL database using Spring Data JPA.
  - Reopening conversations retrieves complete, deterministically ordered history (`GET /api/conversations/{id}/messages`).
  - Participant authorization check prevents unauthorized users from reading private conversations.
- **Modern Responsive UX**:
  - Dark glassmorphism interface with smooth animations, mobile-friendly drawer navigation, inline input validation, optimistic pending states, and connection status indicators.

---

## Technology Stack

| Concern | Technology |
|---|---|
| **Frontend** | React (Vite SPA), Vanilla CSS Design Tokens, `@stomp/stompjs`, `sockjs-client`, `axios`, `lucide-react` |
| **Backend Framework** | Java 17+, Spring Boot 3.2.5, Spring Web, Spring Security, Spring Data JPA |
| **Authentication** | JJWT (`io.jsonwebtoken:jjwt-api:0.11.5`), BCrypt Password Encoder |
| **Real-Time Protocol** | Spring WebSocket, STOMP Messaging Broker |
| **Database & Driver** | MySQL 8.x, `com.mysql:mysql-connector-j` |

---

## Database Schema Model

- **`users`**: `id` (PK), `username` (UNIQUE), `email` (UNIQUE), `password` (BCrypt hash), `created_at`, `updated_at`.
- **`conversations`**: `id` (PK), `user_pair_key` (UNIQUE, e.g. `"12_34"`), `created_at`, `updated_at`.
- **`conversation_participants`**: Composite PK `(conversation_id, user_id)`, `joined_at`.
- **`messages`**: `id` (PK), `conversation_id` (FK), `sender_id` (FK), `content` (TEXT), `created_at`.

---

## REST API Specification

### Authentication APIs
- **`POST /api/auth/register`** — Register a new account (`username`, `email`, `password`). Returns JWT token & user profile.
- **`POST /api/auth/login`** — Authenticate credentials (`email`, `password`). Returns JWT token & user profile.
- **`GET /api/auth/me`** *(Protected)* — Retrieve profile of currently authenticated user.

### User Discovery APIs
- **`GET /api/users/search?query={q}`** *(Protected)* — Search registered users by username/email (excludes caller).
- **`GET /api/users/{id}`** *(Protected)* — Fetch user profile DTO.

### Conversation & Chat APIs
- **`POST /api/conversations`** *(Protected)* — Create or retrieve direct conversation with `{ targetUserId }`.
- **`GET /api/conversations`** *(Protected)* — List all active conversations for current user.
- **`GET /api/conversations/{id}`** *(Protected)* — Fetch conversation metadata (verifies participant membership).
- **`GET /api/conversations/{id}/messages`** *(Protected)* — Fetch chronological chat history.
- **`POST /api/conversations/{id}/messages`** *(Protected)* — Send message via REST.

### System APIs
- **`GET /api/health`** *(Public)* — Returns system health status (`UP`).

---

## Real-Time WebSocket & STOMP Protocol

- **STOMP Endpoint**: `/ws` (with SockJS fallback).
- **Connect Headers**: `Authorization: Bearer <jwt_token>`
- **Publish Destination**: `/app/chat.sendMessage` — Body: `{ "conversationId": 12, "content": "Hello!" }`
- **Subscribe Topic**: `/topic/conversation.{conversationId}`

---

## Setup & Local Run Instructions

### Prerequisites
1. **Java JDK 17+**
2. **Node.js (v18+) & npm**
3. **MySQL Server 8.x** running on `localhost:3306`

### 1. Database Setup
```sql
CREATE DATABASE IF NOT EXISTS rtca_db;
```

### 2. Backend Setup & Run
```bash
cd backend

# Run tests
mvn test

# Run Spring Boot application
mvn spring-boot:run
```
The backend server starts at `http://localhost:8080`.

### 3. Frontend Setup & Run
```bash
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```
The React frontend starts at `http://localhost:5173`.

---

## Testing & Quality Assurance

All core application features are covered by automated integration test suites (`19/19 tests passing`):
- `DatabaseFoundationTest`: Entity persistence, composite keys, pair key uniqueness.
- `AuthenticationSecurityTest`: Registration, login, password hashing, JWT generation, 401 unauthorized protection.
- `UserDiscoveryConversationTest`: User search filtering, conversation creation, access control.
- `WebSocketMessagingTest`: STOMP connection, token authorization interceptor, real-time broadcast loop, MySQL persistence.
- `MasterSecurityHardeningTest`: Password privacy audit, blank message 400 rejection, oversized message 400 rejection, invalid JWT token 401 rejection.

Run full test suite:
```bash
cd backend
mvn test
```

---

## Environment Variables

| Variable | Description | Default Value |
|---|---|---|
| `DB_URL` | MySQL JDBC Connection URL | `jdbc:mysql://localhost:3306/rtca_db?useSSL=false&serverTimezone=UTC` |
| `DB_USERNAME` | MySQL Database Username | `root` |
| `DB_PASSWORD` | MySQL Database Password | *(empty)* |
| `JWT_SECRET` | 256-bit Secret Key for JWT Signing | *(Generated default key)* |
| `CORS_ALLOWED_ORIGINS` | Allowed origins for CORS policy | `http://localhost:5173` |
| `PORT` | Spring Boot Server Port | `8080` |

---

## License
MIT License
