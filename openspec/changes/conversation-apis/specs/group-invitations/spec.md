## ADDED Requirements

### Requirement: Send group invitation
The system SHALL allow group admins to invite users to join group conversations. Invitations SHALL expire after 7 days.

#### Scenario: Admin invites user to group
- **WHEN** group admin POST /api/v1/invites with conversationId and inviteeId
- **THEN** system creates group_invites document with status "pending"
- **AND** sets expiresAt to 7 days from now
- **AND** enforces unique pending invite per (conversation, invitee) pair
- **AND** returns created invitation

#### Scenario: Duplicate pending invite prevented
- **WHEN** admin attempts to create second pending invite for same (conversation, invitee)
- **THEN** system returns 409 Conflict with error message

#### Scenario: Non-admin attempts invite
- **WHEN** group member (non-admin) POST /api/v1/invites
- **THEN** system returns 403 Forbidden

### Requirement: List pending invitations
The system SHALL allow users to list their pending incoming invitations.

#### Scenario: List pending invites
- **WHEN** authenticated user GET /api/v1/invites
- **THEN** system returns all group_invites where inviteeId matches user and status is "pending"
- **AND** sorts by createdAt descending (most recent first)
- **AND** includes conversation details for each invite

### Requirement: Accept invitation
The system SHALL allow invitees to accept pending invitations. Expired invitations SHALL NOT be acceptible.

#### Scenario: Accept valid invitation
- **WHEN** invitee POST /api/v1/invites/{id}/accept
- **THEN** system updates invitation status to "accepted"
- **AND** creates conversation_members document for user
- **AND** returns success response

#### Scenario: Accept expired invitation
- **WHEN** invitee attempts POST /api/v1/invites/{id}/accept after expiresAt
- **THEN** system returns 410 Gone with error message

#### Scenario: Non-invitee attempts accept
- **WHEN** user attempts POST /api/v1/invites/{id}/accept for another user's invitation
- **THEN** system returns 403 Forbidden

### Requirement: Decline invitation
The system SHALL allow invitees to decline pending invitations.

#### Scenario: Decline invitation
- **WHEN** invitee POST /api/v1/invites/{id}/decline
- **THEN** system updates invitation status to "declined"
- **AND** returns 204 No Content

#### Scenario: Decline already accepted invitation
- **WHEN** invitee attempts POST /api/v1/invites/{id}/decline on accepted invitation
- **THEN** system returns 409 Conflict with error message

### Requirement: Automatic expiration cleanup
The system SHALL automatically clean up expired invitations using TTL index.

#### Scenario: Expired invitation purged
- **WHEN** gi_expiresAt_ttl TTL index processes expired document
- **THEN** system removes expired group_invites document from database
