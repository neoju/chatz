## ADDED Requirements

### Requirement: Send message
The system SHALL allow conversation members to send messages. Messages SHALL support text content, reply references, and be associated with a conversation.

#### Scenario: Send text message
- **WHEN** conversation member POST /api/v1/messages with conversationId and content
- **THEN** system creates message document with sentAt timestamp
- **AND** updates conversation updatedAt timestamp
- **AND** increments unreadCount for all other conversation members
- **AND** returns created message with id

#### Scenario: Reply to message
- **WHEN** conversation member POST /api/v1/messages with conversationId, content, and replyTo messageId
- **THEN** system creates message document with replyTo reference
- **AND** returns created message with reply metadata

#### Scenario: Send message with attachments
- **WHEN** conversation member POST /api/v1/messages with conversationId, content, and attachment metadata
- **THEN** system creates message document and message_attachment documents
- **AND** returns created message with attachment references

### Requirement: List messages with cursor pagination
The system SHALL support cursor-based pagination for message listing using (sentAt, _id) as cursor. Skip-based pagination SHALL NOT be supported.

#### Scenario: First page of messages
- **WHEN** conversation member GET /api/v1/messages?conversationId={id}&limit=50
- **THEN** system returns most recent 50 messages sorted by sentAt descending
- **AND** includes nextCursor in response if more messages exist

#### Scenario: Paginate with cursor
- **WHEN** conversation member GET /api/v1/messages?conversationId={id}&cursor={sentAt}:{_id}&limit=50
- **THEN** system returns 50 messages older than cursor
- **AND** uses msg_conv_sentAt_id index for efficient query

#### Scenario: Handle messages with same sentAt
- **WHEN** messages share same sentAt millisecond
- **THEN** system uses _id as tiebreaker in sort and cursor
- **AND** no messages are duplicated or skipped across pages

### Requirement: Edit message
The system SHALL allow message senders to edit their messages within 15 minutes of sending. Edited messages SHALL retain edit history marker.

#### Scenario: Edit own message
- **WHEN** message sender PATCH /api/v1/messages/{id} with new content within 15 minutes
- **THEN** system updates message content and sets editedAt timestamp
- **AND** returns updated message

#### Scenario: Edit after time limit
- **WHEN** message sender PATCH /api/v1/messages/{id} after 15 minutes
- **THEN** system returns 403 Forbidden

#### Scenario: Edit other user's message
- **WHEN** user attempts PATCH /api/v1/messages/{id} for another user's message
- **THEN** system returns 403 Forbidden

### Requirement: Delete message
The system SHALL allow message senders or conversation admins to soft-delete messages. Deleted messages SHALL appear with placeholder content.

#### Scenario: Delete own message
- **WHEN** message sender DELETE /api/v1/messages/{id}
- **THEN** system sets deletedAt timestamp on message
- **AND** returns 204 No Content

#### Scenario: Admin deletes message
- **WHEN** group admin DELETE /api/v1/messages/{id}
- **THEN** system sets deletedAt timestamp on message
- **AND** returns 204 No Content
