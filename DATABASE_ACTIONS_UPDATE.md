# Database Actions Update - Proper Foreign Key Joins

## Overview
Updated all database action files to properly use Supabase foreign key relationships when joining related data. This ensures that queries return valid related values based on the actual database schema.

## Changes Made

### 1. **boards.ts** - Board Actions
- **getOrganizationBoards**: Added proper joins for organization and creator profile
  ```typescript
  .select(`
    *,
    organization:organizations!boards_org_id_fkey(id, name, description),
    creator:user_profiles!boards_created_by_fkey(id, email, display_name, avatar_url)
  `)
  ```

- **getBoard**: Added proper joins for organization and creator profile
  - Uses foreign key notation: `boards_org_id_fkey` and `boards_created_by_fkey`

### 2. **cards.ts** - Card Actions
- **getListCards**: Added comprehensive joins for all related data
  ```typescript
  .select(`
    *,
    list:lists!cards_list_id_fkey(id, title, position),
    board:boards!cards_board_id_fkey(id, name, org_id),
    assigned_profile:user_profiles!cards_assigned_to_fkey(id, email, display_name, avatar_url),
    creator_profile:user_profiles!cards_created_by_fkey(id, email, display_name, avatar_url)
  `)
  ```

- **getCard**: Updated to use proper foreign key references
  - Fixed incorrect joins like `assigned_user:assigned_to(id, email)` 
  - Now uses `assigned_profile:user_profiles!cards_assigned_to_fkey(...)`

- **getBoardCards**: Already had correct joins with proper foreign key notation

### 3. **organizations.ts** - Organization Actions
- **getUserOrganizations**: Added creator profile join
  ```typescript
  .select(`
    *,
    creator:user_profiles!organizations_created_by_fkey(id, email, display_name, avatar_url)
  `)
  ```

- **getOrganization**: Added creator profile join with same foreign key reference

### 4. **dashboard.ts** - Dashboard Statistics
- **getDashboardOverview**: Fixed list join in cards query
  - Changed from `lists(title)` to `list:lists!cards_list_id_fkey(id, title)`

- **getDueDateBreakdown**: Fixed board join in cards query
  - Changed from `boards(name)` to `board:boards!cards_board_id_fkey(id, name)`
  - Updated data access from array notation to direct object access

- **getActivityTimeline**: Fixed all joins for cards, boards, and actors
  ```typescript
  .select(`
    card:cards!card_activities_card_id_fkey(id, title),
    board:boards!card_activities_board_id_fkey(id, name),
    actor:user_profiles!card_activities_actor_id_fkey(id, email, display_name, avatar_url)
  `)
  ```
  - Removed array access patterns like `activity.card[0]?.title`
  - Now uses direct object access: `activity.card?.title`

- **getTeamCollaboration**: Fixed profile joins in organization members
  - Changed from `user_profiles(id, display_name, ...)` 
  - To `profile:user_profiles!organization_members_user_id_fkey(...)`
  - Updated data access patterns throughout

- **formatActivityDescription**: Simplified card title access
  - Removed unnecessary array checks

### 5. **invites.ts** - Invitation Actions
- **getOrganizationInvites**: Added organization and inviter profile joins
  ```typescript
  .select(`
    *,
    organization:organizations!organization_invites_org_id_fkey(id, name, description),
    inviter:user_profiles!organization_invites_invited_by_fkey(id, email, display_name, avatar_url)
  `)
  ```

- **getInviteByToken**: Consolidated three separate queries into one
  - Previously made 3 separate queries for invite, organization, and inviter
  - Now fetches all data in a single query with proper joins
  - Significantly improves performance

## Key Patterns Used

### Foreign Key Notation
```typescript
table_name:referenced_table!constraint_name(columns)
```

Example:
```typescript
creator:user_profiles!boards_created_by_fkey(id, email, display_name, avatar_url)
```

### Constraint Naming Convention
Based on the schema, foreign key constraints follow this pattern:
- `{table}_pkey` - Primary key
- `{table}_{column}_fkey` - Foreign key

Examples:
- `boards_org_id_fkey` - boards table, org_id column
- `cards_created_by_fkey` - cards table, created_by column
- `organization_invites_invited_by_fkey` - organization_invites table, invited_by column

## Benefits

1. **Performance**: Fewer database queries by fetching related data in single queries
2. **Type Safety**: Returns properly structured objects instead of arrays
3. **Consistency**: All actions follow the same pattern for joins
4. **Maintainability**: Clear foreign key references make schema changes easier to track
5. **Correctness**: Matches actual database schema and foreign key constraints

## Data Access Pattern Changes

### Before (Incorrect)
```typescript
// Array access (wrong for single relations)
const cardTitle = Array.isArray(activity.card) ? activity.card[0]?.title : "Unknown"
const boardName = Array.isArray(card.boards) ? card.boards[0]?.name : "Unknown"
```

### After (Correct)
```typescript
// Direct object access (correct for single relations)
const cardTitle = activity.card?.title || "Unknown"
const boardName = card.board?.name || "Unknown"
```

## Testing Recommendations

After these changes, test the following:
1. Board listing and detail views
2. Card operations (create, update, move, delete)
3. Organization member listings
4. Dashboard statistics and charts
5. Activity timeline
6. Invitation flow
7. User profile displays

## Migration Notes

No database migrations required - these are application-level query improvements that align with the existing database schema.
