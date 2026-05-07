## Context

The backend currently has authentication and user management in place but lacks any conversation or messaging functionality. This design implements a complete conversation domain layer following the established MongoDB schema (see `docs/database-schema.md`).

The backend uses:
- **Fastify** with Zod type provider for route validation
- **Mongoose** for MongoDB ODM with `timestamps: true` pattern
- **Modular architecture** under `src/modules/<name>/` with `*.router.ts`, `*.service.ts`, `*.schema.ts`
- **JWT authentication** via `authMiddleware` decorating `request.user`
- **Zod DTOs** from `@chatz/dto` workspace package
- **Path aliases** `@/*` → `./src/*` with ESM `.js` extensions in imports

## Goals / Non-Goals

**Goals:**
- Implement conversation domain models aligned with MongoDB schema design
- Create RESTful API endpoints for all 5 capabilities (conversation, message, membership, invites, read receipts)
- Implement cursor-based pagination for messages (no skip-based pagination)
- Enforce authorization: users only access conversations they are members of
- Support both DM (type: "dm") and group (type: "group") conversation types
- Handle soft deletes (deletedAt) for conversations and messages
- Implement TTL cleanup for expired invitations

**Non-Goals:**
- Real-time WebSocket events (separate change)
- Message search functionality
- File upload/attachment handling (metadata stored, files handled separately)
- Push notifications
- Typing indicators or presence updates
- Rate limiting (to be handled at infrastructure level)

## Decisions

### 1. Module Structure
**Decision:** Create a single `conversation` module under `src/modules/conversation/` containing all conversation-related functionality.

**Rationale:** 
- While 5 capabilities exist, they are tightly coupled (e.g., sending a message affects membership unread counts, invites create memberships)
- Single module reduces cross-import complexity
- Easier to maintain transaction boundaries

**Alternative considered:** Separate modules for `conversation`, `message`, `membership`, `invite` — rejected due to excessive service inter-dependencies.

### 2. Cursor Pagination Implementation
**Decision:** Use `(sentAt, _id)` tuple encoded as base64 cursor string for message pagination.

**Rationale:**
- Matches the `msg_conv_sentAt_id` index in MongoDB for O(log n) performance
- `sentAt` provides chronological ordering, `_id` handles millisecond collisions
- No offset-based pagination to avoid performance degradation at depth

**Format:** Cursor = base64(JSON.stringify({ sentAt: ISOString, _id: string }))

### 3. Read Receipts via conversation_members
**Decision:** Store read position in `conversation_members` collection only, never on messages.

**Rationale:**
- Per database schema design: storing `readBy` on each message causes unbounded write amplification
- Single `lastReadMessageId` per user per conversation enables efficient unread count calculation
- Read status computed at query time: message is "read" if `sentAt <= member.lastReadAt`

**Trade-off:** Cannot query "who read this specific message" without scanning all members' read positions.

### 4. Authorization Pattern
**Decision:** Create `requireConversationMember` middleware that:
1. Validates user is authenticated (JWT)
2. Checks user is member of requested conversation
3. Attaches `conversation` and `membership` to request object

**Rationale:**
- Centralizes authorization logic
- Prevents repetitive member lookups in every route handler
- Enables fine-grained role checks (admin vs member)

**Usage:** Wrap protected conversation routes in `app.register(async (app) => { await app.register(requireConversationMember) })`

### 5. Soft Delete Strategy
**Decision:** Use `deletedAt` timestamp for both conversations and messages. List queries filter `deletedAt: null`.

**Rationale:**
- Preserves data for potential audit/legal requirements
- Allows "undo delete" feature later
- TTL index can eventually purge old deleted data

**Trade-off:** Requires all queries to include `deletedAt: null` filter.

### 6. Transaction Boundaries
**Decision:** Use Mongoose transactions for multi-document operations:
- Creating conversation + initial memberships
- Accepting invite + creating membership + updating invite status
- Sending message + updating conversation updatedAt + incrementing unread counts

**Rationale:**
- Prevents inconsistent state on partial failures
- MongoDB 7 supports multi-document ACID transactions

### 7. Schema Field Mapping
**Decision:** Map MongoDB schema fields exactly, using camelCase for JS/TS, with these specific patterns:
- `ObjectId` → `mongoose.Types.ObjectId` or string representation
- Timestamps: use `timestamps: true` Mongoose option
- Enums: define in `@chatz/shared`, import into schemas

**New enums to add to `@chatz/shared`:**
```typescript
enum ConversationType { DM = 'dm', GROUP = 'group' }
enum ConversationRole { ADMIN = 'admin', MEMBER = 'member' }
enum InviteStatus { PENDING = 'pending', ACCEPTED = 'accepted', DECLINED = 'declined' }
enum MessageContentType { TEXT = 'text', IMAGE = 'image', FILE = 'file' }
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **N+1 query problem** when listing conversations with member counts | Use aggregation pipeline with `$lookup` or add denormalized `memberCount` field to conversation document |
| **Unread count becomes stale** if message deleted after count calculated | Recalculate unread count on read-marker update; use atomic `$inc` for incrementing |
| **Cursor pagination breaks** if message edited changing `sentAt` | **Decision:** Editing does not change `sentAt`, only sets `editedAt`. Cursor stability maintained. |
| **Race condition** on accepting same invite twice | Use unique partial index on `group_invites` (conversationId + inviteeId + status: pending) and handle MongoDB duplicate key error |
| **Performance degradation** with large groups (>1000 members) | Implement pagination on member lists; consider read receipt aggregation strategies for very large groups |
| **Authorization middleware performance** | Cache membership checks in request lifecycle; reuse lookup results across route handlers |

## Migration Plan

**No migration needed** - this is a new feature adding collections and APIs to existing database.

**Deployment steps:**
1. Ensure MongoDB indexes exist (see schema files for index definitions)
2. Deploy backend with new endpoints
3. Verify TTL index on `group_invites.expiresAt` is active

**Rollback:**
- Remove new endpoints by reverting commit
- Data in new collections remains but APIs are unavailable

## Open Questions

1. **✅ DECIDED: Implement optimistic concurrency control** - Add `versionKey` to all mutable documents (conversations, messages, members) to prevent lost updates on concurrent edits.

2. **✅ DECIDED: MongoDB full-text search index** - Create text index on message content field (`{ content: 'text' }`) for basic search functionality. Elasticsearch deferred to future if needed.

3. **Group size limits?** Should we enforce maximum group size (e.g., 500 members)? Currently not specified.

4. **Should deleted messages be editable?** Decision: No - once deleted, content cannot be modified.
