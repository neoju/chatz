## 1. Shared Types and Enums

- [x] 1.1 Add `ConversationType` enum to `@chatz/shared` (DM, GROUP)
- [x] 1.2 Add `ConversationRole` enum to `@chatz/shared` (ADMIN, MEMBER)
- [x] 1.3 Add `InviteStatus` enum to `@chatz/shared` (PENDING, ACCEPTED, DECLINED)
- [x] 1.4 Add `MessageContentType` enum to `@chatz/shared` (TEXT, IMAGE, FILE)
- [x] 1.5 Build `@chatz/shared` package (`pnpm --filter @chatz/shared build`)

## 2. DTOs and Validation Schemas

- [x] 2.1 Create conversation DTOs: CreateConversationRequest, ConversationResponse, UpdateConversationRequest
- [x] 2.2 Create message DTOs: SendMessageRequest, MessageResponse, EditMessageRequest, ListMessagesQuery
- [x] 2.3 Create membership DTOs: MemberResponse, UpdateMemberRequest, MemberNicknameRequest
- [x] 2.4 Create invitation DTOs: CreateInviteRequest, InviteResponse, ListInvitesQuery
- [x] 2.5 Create read receipt DTOs: MarkReadRequest, UnreadSummaryResponse
- [x] 2.6 Create pagination DTOs: CursorPaginationQuery, CursorPaginationResponse
- [x] 2.7 Create search DTOs: SearchMessagesQuery, SearchMessagesResponse
- [x] 2.8 Build `@chatz/dto` package (`pnpm --filter @chatz/dto build`)

## 3. Mongoose Schemas and Models

- [x] 3.1 Create `Conversation` schema with indexes (type, createdAt)
- [x] 3.2 Create `Message` schema with indexes (conversationId + sentAt + _id)
- [x] 3.3 Create `ConversationMember` schema with indexes (userId + conversationId unique, conversationId, userId + pinned)
- [x] 3.4 Create `GroupInvite` schema with indexes (inviteeId + status, conversationId + inviteeId partial unique, expiresAt TTL)
- [x] 3.5 Create `MessageAttachment` schema with indexes (messageId, conversationId + createdAt)
- [x] 3.6 Add `versionKey` to Conversation, Message, and ConversationMember schemas for optimistic concurrency control
- [x] 3.7 Create full-text search index on Message content field (`{ content: 'text' }`)

## 4. Middleware and Authorization

- [x] 4.1 Create `requireConversationMember` middleware
- [x] 4.2 Implement member lookup and attachment to request object
- [x] 4.3 Add role checking helper (isAdmin, isMember)
- [x] 4.4 Handle 403 responses for non-members

## 5. Service Layer Implementation

### 5.1 Conversation Management Service
- [x] 5.1.1 Implement `createConversation` (DM and group types)
- [x] 5.1.2 Implement `listConversations` with pinned sorting
- [x] 5.1.3 Implement `getConversation` with member list
- [x] 5.1.4 Implement `updateConversation` (admin only)
- [x] 5.1.5 Implement `deleteConversation` soft delete (admin only)

### 5.2 Message Management Service
- [x] 5.2.1 Implement `sendMessage` with conversation updatedAt and unread increment
- [x] 5.2.2 Implement `listMessages` with cursor pagination
- [x] 5.2.3 Implement cursor encoding/decoding utilities
- [x] 5.2.4 Implement `editMessage` with 15-minute time limit and versionKey check
- [x] 5.2.5 Implement `deleteMessage` soft delete
- [x] 5.2.6 Implement `searchMessages` with full-text search using text index

### 5.3 Membership Service
- [x] 5.3.1 Implement `joinConversation` via invite acceptance
- [x] 5.3.2 Implement `leaveConversation` with admin validation
- [x] 5.3.3 Implement `updateMemberRole` (admin only)
- [x] 5.3.4 Implement `pinConversation` toggle
- [x] 5.3.5 Implement `muteConversation` toggle
- [x] 5.3.6 Implement `updateNickname`

### 5.4 Group Invitation Service
- [x] 5.4.1 Implement `createInvite` with duplicate prevention
- [x] 5.4.2 Implement `listPendingInvites` for user
- [x] 5.4.3 Implement `acceptInvite` with membership creation
- [x] 5.4.4 Implement `declineInvite`

### 5.5 Read Receipts Service
- [x] 5.5.1 Implement `markAsRead` with lastReadMessageId update
- [x] 5.5.2 Implement `getUnreadCount` for conversation
- [x] 5.5.3 Implement `getUnreadSummary` across all conversations
- [x] 5.5.4 Implement read status computation for messages (DM vs group)

## 6. Router Layer Implementation

### 6.1 Conversation Routes
- [x] 6.1.1 POST /api/v1/conversations - Create conversation
- [x] 6.1.2 GET /api/v1/conversations - List user conversations
- [x] 6.1.3 GET /api/v1/conversations/:id - Get conversation details
- [x] 6.1.4 PATCH /api/v1/conversations/:id - Update conversation
- [x] 6.1.5 DELETE /api/v1/conversations/:id - Delete conversation

### 6.2 Message Routes
- [x] 6.2.1 POST /api/v1/messages - Send message
- [x] 6.2.2 GET /api/v1/messages - List messages (with conversationId query)
- [x] 6.2.3 PATCH /api/v1/messages/:id - Edit message
- [x] 6.2.4 DELETE /api/v1/messages/:id - Delete message
- [x] 6.2.5 GET /api/v1/messages/search - Search messages with full-text search

### 6.3 Membership Routes
- [x] 6.3.1 POST /api/v1/conversations/:id/leave - Leave conversation
- [x] 6.3.2 POST /api/v1/conversations/:id/pin - Pin conversation
- [x] 6.3.3 POST /api/v1/conversations/:id/unpin - Unpin conversation
- [x] 6.3.4 POST /api/v1/conversations/:id/mute - Mute conversation
- [x] 6.3.5 POST /api/v1/conversations/:id/unmute - Unmute conversation
- [x] 6.3.6 PATCH /api/v1/conversations/:id/nickname - Update nickname
- [x] 6.3.7 PATCH /api/v1/conversations/:id/members/:userId - Update member role

### 6.4 Invitation Routes
- [x] 6.4.1 POST /api/v1/invites - Create invitation
- [x] 6.4.2 GET /api/v1/invites - List pending invitations
- [x] 6.4.3 POST /api/v1/invites/:id/accept - Accept invitation
- [x] 6.4.4 POST /api/v1/invites/:id/decline - Decline invitation

### 6.5 Read Receipt Routes
- [x] 6.5.1 POST /api/v1/conversations/:id/read - Mark as read
- [x] 6.5.2 GET /api/v1/conversations/:id/unread - Get unread count
- [x] 6.5.3 GET /api/v1/conversations/unread-summary - Get total unread summary

## 7. Server Integration

- [x] 7.1 Import conversation router in `server.ts`
- [x] 7.2 Register conversation routes under auth-protected scope
- [x] 7.3 Apply `requireConversationMember` middleware to nested routes
- [x] 7.4 Verify Swagger docs are generated at `/api/docs`

## 8. Testing and Verification

- [x] 8.1 Test create DM conversation
- [x] 8.2 Test create group conversation
- [x] 8.3 Test cursor pagination for messages
- [x] 8.4 Test authorization (non-member access denied)
- [x] 8.5 Test role-based permissions (admin vs member)
- [x] 8.6 Test invitation flow (create, accept, decline)
- [x] 8.7 Test read receipts and unread counts
- [x] 8.8 Test optimistic concurrency control (versionKey conflicts)
- [x] 8.9 Test message search with full-text index
- [x] 8.10 Run type check (`pnpm --filter backend check-types`)
- [x] 8.11 Run linter (`pnpm --filter backend lint`)

## 9. Documentation

- [x] 9.1 Update API documentation with new endpoints
- [x] 9.2 Document cursor pagination format
- [x] 9.3 Document authorization requirements per endpoint
