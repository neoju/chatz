## Why

The backend needs comprehensive conversation APIs to support real-time messaging functionality. Currently there's no API layer for creating conversations, sending messages, or managing group memberships. This change implements the full conversation domain APIs following the established MongoDB schema design.

## What Changes

- **New REST API endpoints** for conversation CRUD operations (create, read, update, delete/list)
- **New REST API endpoints** for message operations (send, edit, delete, list with cursor pagination)
- **New REST API endpoints** for conversation membership management (join, leave, update role, pin/mute)
- **New REST API endpoints** for group invitations (invite, accept, decline, list pending)
- **New REST API endpoints** for read receipts (mark as read, get unread counts)
- **Input validation** using Zod schemas aligned with database constraints
- **Authorization middleware** to ensure users can only access their own conversations
- **API documentation** with OpenAPI/Swagger specs

## Capabilities

### New Capabilities
- `conversation-management`: Create, update, delete, and list conversations. Supports both direct messages (DM) and group conversations.
- `message-management`: Send, edit, delete, and paginate through messages in conversations using cursor-based pagination.
- `conversation-membership`: Manage conversation participants including joining, leaving, role assignment (admin/member), and member metadata (nickname, pinned, muted).
- `group-invitations`: Invite users to group conversations with expiration handling, accept/decline flows.
- `read-receipts`: Track message read status per user per conversation, update unread counts, and query read positions.

### Modified Capabilities
- None (no existing conversation-related specs to modify)

## Impact

**Affected Code:**
- `apps/backend/src/` - New modules for conversation domain
- `apps/backend/src/routes/` - New API route handlers
- `apps/backend/src/services/` - New business logic services
- `apps/backend/src/models/` - Mongoose schemas aligned with database design
- `apps/backend/src/middleware/` - Authorization checks

**API Surface:**
- REST endpoints under `/api/v1/conversations/*`
- REST endpoints under `/api/v1/messages/*`
- REST endpoints under `/api/v1/invites/*`

**Dependencies:**
- MongoDB 7 (already configured)
- Mongoose ODM (already in use)
- Zod for validation (already in project)

**No Breaking Changes** - This is a purely additive feature introducing new APIs.
