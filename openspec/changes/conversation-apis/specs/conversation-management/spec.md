## ADDED Requirements

### Requirement: Create conversation
The system SHALL allow authenticated users to create conversations. Direct messages (type: "dm") require exactly 2 participants. Group conversations (type: "group") require at least 2 participants.

#### Scenario: Create DM conversation
- **WHEN** authenticated user POST /api/v1/conversations with type "dm" and one other participant
- **THEN** system creates a conversation document and two conversation_members documents
- **AND** returns the created conversation with id

#### Scenario: Create group conversation
- **WHEN** authenticated user POST /api/v1/conversations with type "group", name, and participants
- **THEN** system creates a conversation document and conversation_members for each participant
- **AND** creator is assigned role "admin"
- **AND** returns the created conversation with id

### Requirement: List user conversations
The system SHALL allow authenticated users to list all conversations they are members of. Conversations SHALL be sorted with pinned conversations first, then by most recent activity.

#### Scenario: List conversations with pinned items
- **WHEN** authenticated user GET /api/v1/conversations
- **THEN** system returns paginated list of conversations user is a member of
- **AND** pinned conversations appear first in the list
- **AND** within pin groups, sorted by updatedAt descending

### Requirement: Get conversation details
The system SHALL allow conversation members to retrieve full conversation details including member list.

#### Scenario: Get conversation as member
- **WHEN** conversation member GET /api/v1/conversations/{id}
- **THEN** system returns conversation details with member list and metadata

#### Scenario: Get conversation as non-member
- **WHEN** non-member attempts GET /api/v1/conversations/{id}
- **THEN** system returns 403 Forbidden

### Requirement: Update conversation
The system SHALL allow group conversation admins to update conversation metadata (name). DM conversations SHALL NOT be editable.

#### Scenario: Admin updates group name
- **WHEN** group admin PATCH /api/v1/conversations/{id} with new name
- **THEN** system updates conversation name and updatedAt timestamp
- **AND** returns updated conversation

#### Scenario: Member attempts update
- **WHEN** group member (non-admin) PATCH /api/v1/conversations/{id}
- **THEN** system returns 403 Forbidden

### Requirement: Delete conversation
The system SHALL allow group conversation admins to soft-delete conversations. Deleted conversations SHALL NOT appear in list results.

#### Scenario: Admin deletes group
- **WHEN** group admin DELETE /api/v1/conversations/{id}
- **THEN** system soft-deletes conversation (sets deletedAt)
- **AND** returns 204 No Content
