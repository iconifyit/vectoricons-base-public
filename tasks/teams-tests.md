IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create contract-based tests for teams and team-types modules

## Goal
Add contract-based tests for both teams and team-types modules using the established contract testing pattern. Since team-types is a submodule of teams, both will be handled in this branch.

## Module Analysis

### Teams Module
**Model**: `refs/db-models/teams.js`
- Fields: id, name, user_id, team_type_id, is_active, created_at, updated_at
- Required: name
- Relations:
  - families (HasMany)
  - sets (HasMany)
  - icons (HasMany)
  - illustrations (HasMany)
  - teamType (BelongsToOne)
  - owner/user (BelongsToOne)

**Entity**: `src/teams/TeamEntity.js`
- All model fields present in allowedColumns ✅
- **Issue**: Missing relatedEntities configuration
- **Fix needed**: Add relatedEntities for teamType and owner

**Service**: Expected to support activation, getAll, standard CRUD

### Team Types Module
**Model**: `refs/db-models/team-types.js`
- Fields: id, label, value, is_active
- Required: label, value
- Relations: teams (HasMany)

**Entity**: `src/teams/team-types/TeamTypeEntity.js`
- All model fields present in allowedColumns ✅
- **Issue**: Missing relatedEntities configuration
- **Fix needed**: Add relatedEntities for teams

**Service**: Expected to support activation, getAll, standard CRUD

## Implementation Plan

### 1. Fix Entity Configurations
Update TeamEntity to add relatedEntities:
```javascript
relatedEntities: {
    teamType: () => require('./team-types/TeamTypeEntity'),
    owner: () => require('../users/UserEntity'),
    families: () => require('../products/families/FamilyEntity'),
    sets: () => require('../products/sets/SetEntity'),
    icons: () => require('../products/icons/IconEntity'),
    illustrations: () => require('../products/illustrations/IllustrationEntity'),
}
```

Update TeamTypeEntity to add relatedEntities:
```javascript
relatedEntities: {
    teams: () => require('../TeamEntity'),
}
```

### 2. Create Test Files for Teams
- `src/teams/__tests__/seed.js` - seedOne, seedMany, seedEntity
- `src/teams/__tests__/entity.test.js` - Entity contract tests
- `src/teams/__tests__/repository.test.js` - Repository contract tests
- `src/teams/__tests__/service.test.js` - Service contract tests

### 3. Create Test Files for Team Types
- `src/teams/team-types/__tests__/seed.js` - seedOne, seedMany, seedEntity
- `src/teams/team-types/__tests__/entity.test.js` - Entity contract tests
- `src/teams/team-types/__tests__/repository.test.js` - Repository contract tests
- `src/teams/team-types/__tests__/service.test.js` - Service contract tests

### 4. Seed Data Considerations
**Teams:**
- Needs valid team_type_id (use existing team type or create one in seed)
- Needs valid user_id (use user_id = 1)
- Unique constraint on name

**Team Types:**
- Unique constraint on label and value
- Simple lookup table with label/value pairs

## Test Command
```bash
npm run test src/teams/__tests__/
npm run test src/teams/team-types/__tests__/
```

## Expected Results
- Teams: 3 test suites, ~30 tests
- Team Types: 3 test suites, ~30 tests
- Both support activation methods
- Tests relations to respective entities
