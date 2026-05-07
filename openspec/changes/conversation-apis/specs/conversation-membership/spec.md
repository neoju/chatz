## ADDED Requirements

### Requirement: Join conversation
The system SHALL allow users to join group conversations via invitation acceptance. DM conversations SHALL NOT support joining outside creation.

#### Scenario: Accept group invite joins conversation
- **WHEN** user accepts group invitation
- **THEN** system creates conversation_members document with role "member"
- **AND** sets joinedAt timestamp
- **AND** adds user to conversation

### Requirement: Leave conversation
The system SHALL allow members to leave conversations. Admins can only leave if another admin exists.

#### Scenario: Member leaves group
- **WHEN** conversation member POST /api/v1/conversations/{id}/leave
- **THEN** system removes conversation_members document
- **AND** if last member, soft-delete conversation
- **AND** returns 204 No Content

#### Scenario: Last admin cannot leave
- **WHEN** sole admin attempts POST /api/v1/conversations/{id}/leave
- **THEN** system returns 400 Bad Request with error message

### Requirement: Update member role
The system SHALL allow group admins to assign roles to other members. Roles SHALL be "admin" or "member".

#### Scenario: Admin promotes member
- **WHEN** group admin PATCH /api/v1/conversations/{id}/members/{userId} with role "admin"
- **THEN** system updates member's role field
- **AND** returns updated member record

#### Scenario: Member attempts role change
- **WHEN** group member attempts PATCH /api/v1/conversations/{id}/members/{userId}
- **THEN** system returns 403 Forbidden

### Requirement: Pin conversation
The system SHALL allow members to pin/unpin conversations for themselves. Pinned status is per-user.

#### Scenario: User pins conversation
- **WHEN** conversation member POST /api/v1/conversations/{id}/pin
- **THEN** system sets pinned=true on user's conversation_members document
- **AND** returns updated member record

#### Scenario: User unpins conversation
- **WHEN** conversation member POST /api/v1/conversations/{id}/unpin
- **THEN** system sets pinned=false on user's conversation_members document
- **AND** returns updated member record

### Requirement: Mute conversation
The system SHALL allow members to mute/unmute conversations. Muted conversations SHALL NOT increment unreadCount.

#### Scenario: User mutes conversation
- **WHEN** conversation member POST /api/v1/conversations/{id}/mute
- **THEN** system sets muted=true on user's conversation_members document
- **AND** returns updated member record

#### Scenario: Muted conversation unread behavior
- **WHEN** new message sent to muted conversation
- **THEN** system skips incrementing unreadCount for muted members
- **AND** message is still delivered

### Requirement: Update member nickname
The system SHALL allow members to set their nickname per conversation visible to all participants.

#### Scenario: User sets nickname
- **WHEN** conversation member PATCH /api/v1/conversations/{id}/nickname with nickname value
- **THEN** system updates nickname field on user's conversation_members document
- **AND** returns updated member record
- **AND** nickname appears in conversation member list for others
