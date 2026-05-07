## ADDED Requirements

### Requirement: Mark messages as read
The system SHALL allow conversation members to mark messages as read up to a specific point. Read status SHALL be stored per member in conversation_members.

#### Scenario: Mark conversation as read
- **WHEN** conversation member POST /api/v1/conversations/{id}/read with lastReadMessageId
- **THEN** system updates conversation_members.lastReadMessageId
- **AND** updates conversation_members.lastReadAt to current time
- **AND** resets conversation_members.unreadCount to 0
- **AND** returns updated member record

#### Scenario: Mark read updates unread count
- **WHEN** member marks messages as read
- **THEN** system recalculates unreadCount based on messages newer than lastReadMessageId
- **AND** updates conversation_members.unreadCount

### Requirement: Get unread count
The system SHALL allow members to retrieve their unread message count per conversation.

#### Scenario: Get conversation unread count
- **WHEN** conversation member GET /api/v1/conversations/{id}/unread
- **THEN** system returns conversation_members.unreadCount value
- **AND** returns total unread messages in conversation

#### Scenario: Unread count excludes deleted messages
- **WHEN** calculating unread count
- **THEN** system excludes messages with deletedAt set
- **AND** only counts messages newer than lastReadMessageId

### Requirement: Compute read status for messages
The system SHALL compute read status for messages at query time using conversation_members data. No readBy array SHALL be stored on messages.

#### Scenario: Message read status in DM
- **WHEN** system returns message in DM conversation
- **THEN** computes read status by comparing message.sentAt to otherParticipant.lastReadAt
- **AND** marks message as "read" if sentAt <= lastReadAt
- **AND** includes readAt timestamp in response

#### Scenario: Message read status in group
- **WHEN** system returns message in group conversation
- **THEN** computes read count by querying conversation_members for lastReadMessageId >= message._id
- **AND** includes read count (X of N members) in response

### Requirement: Sidebar unread summary
The system SHALL provide aggregated unread counts across all conversations for the sidebar.

#### Scenario: Get total unread across conversations
- **WHEN** authenticated user GET /api/v1/conversations/unread-summary
- **THEN** system sums unreadCount from all user's conversation_members documents
- **AND** returns total unread count and per-conversation breakdown
- **AND** excludes muted conversations from total (unless explicitly requested)
