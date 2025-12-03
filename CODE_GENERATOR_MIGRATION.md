# Code Generator Migration Guide

## Overview

The new `CodeGenerator` utility provides a centralized, generic solution for generating unique codes across all entities in the system.

## Supported Entity Types

| Entity Type | Prefix | Format      | Example     | Table              | Column           |
|-------------|--------|-------------|-------------|--------------------|------------------|
| Worker      | BSW    | BSW-00001   | BSW-00001   | profiles           | candidate_code   |
| Candidate   | BSC    | BSC-00001   | BSC-00001   | profiles           | candidate_code   |
| Employer    | BSE    | BSE-001     | BSE-001     | employers          | employer_code    |
| Training    | BST    | BST-001     | BST-001     | training_batches   | batch_code       |
| Trainee     | BST    | BST-00001   | BST-00001   | batch_enrollments  | enrollment_code  |
| Project     | BSP    | BSP-001     | BSP-001     | projects           | project_code     |

## Migration from Old Code

### Before (Old Way)
```typescript
import { ProfileCodeHelper } from '@/services/profiles/profile/helpers/profile-code.helper';

// Only worked for profiles/workers
const code = await ProfileCodeHelper.generate(); // BSW-00001
```

### After (New Way)
```typescript
import { CodeGenerator } from '@/utils/codeGenerator';

// Works for all entity types
const workerCode = await CodeGenerator.generate('worker');       // BSW-00001
const candidateCode = await CodeGenerator.generate('candidate'); // BSC-00001
const employerCode = await CodeGenerator.generate('employer');   // BSE-001
const projectCode = await CodeGenerator.generate('project');     // BSP-001
const trainingCode = await CodeGenerator.generate('training');   // BST-001
const traineeCode = await CodeGenerator.generate('trainee');     // BST-00001
```

## Usage Examples

### 1. Generate Code for Worker
```typescript
import { CodeGenerator } from '@/utils';

const code = await CodeGenerator.generate('worker');
// Result: BSW-00001, BSW-00002, etc.
```

### 2. Generate Code for Employer
```typescript
const employerCode = await CodeGenerator.generate('employer');
// Result: BSE-001, BSE-002, etc.
```

### 3. Generate Code for Project
```typescript
const projectCode = await CodeGenerator.generate('project');
// Result: BSP-001, BSP-002, etc.
```

### 4. Validate Code Format
```typescript
const isValid = CodeGenerator.validate('BSW-00001', 'worker');
// Result: true

const isInvalid = CodeGenerator.validate('BSW-001', 'worker');
// Result: false (wrong padding)
```

### 5. Parse Code to Get Number
```typescript
const number = CodeGenerator.parseNumber('BSW-00001');
// Result: 1
```

### 6. Custom Configuration
```typescript
const customCode = await CodeGenerator.generateWithConfig({
  prefix: 'CUSTOM',
  padding: 4,
  tableName: 'custom_table',
  columnName: 'code',
});
// Result: CUSTOM-0001
```

## Integration in Services

### Employer Service Example
```typescript
import { CodeGenerator } from '@/utils';

class EmployerService {
  async create(data: CreateEmployerDto) {
    const employerCode = await CodeGenerator.generate('employer');

    const employer = await prisma.employers.create({
      data: {
        ...data,
        employer_code: employerCode, // BSE-001
      },
    });

    return employer;
  }
}
```

### Project Service Example
```typescript
import { CodeGenerator } from '@/utils';

class ProjectService {
  async create(data: CreateProjectDto) {
    const projectCode = await CodeGenerator.generate('project');

    const project = await prisma.projects.create({
      data: {
        ...data,
        project_code: projectCode, // BSP-001
      },
    });

    return project;
  }
}
```

### Training Batch Service Example
```typescript
import { CodeGenerator } from '@/utils';

class TrainingBatchService {
  async create(data: CreateTrainingBatchDto) {
    const batchCode = await CodeGenerator.generate('training');

    const batch = await prisma.training_batches.create({
      data: {
        ...data,
        batch_code: batchCode, // BST-001
      },
    });

    return batch;
  }
}
```

## Database Schema Requirements

Ensure your database tables have the appropriate code columns:

```sql
-- Profiles table (for workers and candidates)
ALTER TABLE profiles ADD COLUMN candidate_code VARCHAR(20) UNIQUE;

-- Employers table
ALTER TABLE employers ADD COLUMN employer_code VARCHAR(20) UNIQUE;

-- Projects table
ALTER TABLE projects ADD COLUMN project_code VARCHAR(20) UNIQUE;

-- Training batches table
ALTER TABLE training_batches ADD COLUMN batch_code VARCHAR(20) UNIQUE;

-- Batch enrollments table (for trainees)
ALTER TABLE batch_enrollments ADD COLUMN enrollment_code VARCHAR(20) UNIQUE;
```

## Benefits

1. **Centralized Logic**: All code generation logic in one place
2. **Type-Safe**: TypeScript ensures you use valid entity types
3. **Consistent Format**: All codes follow the same pattern
4. **Extensible**: Easy to add new entity types
5. **Validated**: Built-in validation for code format
6. **Reusable**: Can be used across all services

## Backward Compatibility

The old `ProfileCodeHelper` is still available for backward compatibility but is deprecated. It now internally uses `CodeGenerator`.

```typescript
// Still works but deprecated
import { ProfileCodeHelper } from '@/services/profiles/profile/helpers/profile-code.helper';
const code = await ProfileCodeHelper.generate(); // BSW-00001

// Recommended
import { CodeGenerator } from '@/utils';
const code = await CodeGenerator.generate('worker'); // BSW-00001
```

## Configuration

To modify code formats or add new entity types, update `CODE_CONFIGS` in `src/utils/codeGenerator.ts`:

```typescript
export const CODE_CONFIGS: Record<string, CodeConfig> = {
  // Add new entity type
  newEntity: {
    prefix: 'BSN',
    padding: 4,
    tableName: 'new_entities',
    columnName: 'entity_code',
  },
};
```

## Testing

```typescript
import { CodeGenerator } from '@/utils';

// Test code generation
const code1 = await CodeGenerator.generate('worker');
const code2 = await CodeGenerator.generate('worker');
console.log(code1); // BSW-00001
console.log(code2); // BSW-00002

// Test validation
console.log(CodeGenerator.validate('BSW-00001', 'worker')); // true
console.log(CodeGenerator.validate('BSW-001', 'worker'));   // false

// Test parsing
console.log(CodeGenerator.parseNumber('BSW-00001')); // 1
console.log(CodeGenerator.parseNumber('BSE-042'));   // 42
```

## API Reference

### `CodeGenerator.generate(entityType)`
Generates the next sequential code for the specified entity type.

**Parameters:**
- `entityType`: One of 'worker', 'candidate', 'employer', 'training', 'trainee', 'project'

**Returns:** Promise<string> - Generated code (e.g., 'BSW-00001')

### `CodeGenerator.generateWithConfig(config)`
Generates a code using custom configuration.

**Parameters:**
- `config`: CodeConfig object with prefix, padding, tableName, columnName

**Returns:** Promise<string> - Generated code

### `CodeGenerator.validate(code, entityType)`
Validates if a code matches the expected format for an entity type.

**Parameters:**
- `code`: Code string to validate
- `entityType`: Entity type to validate against

**Returns:** boolean - true if valid, false otherwise

### `CodeGenerator.parseNumber(code)`
Extracts the numeric part from a code.

**Parameters:**
- `code`: Code string (e.g., 'BSW-00001')

**Returns:** number | null - Numeric part or null if invalid

### `CodeGenerator.getPrefix(entityType)`
Gets the prefix for an entity type.

**Parameters:**
- `entityType`: Entity type

**Returns:** string - Prefix (e.g., 'BSW')

## Notes

- Codes are generated sequentially based on the last record in the database
- The generator is thread-safe as it relies on database ordering
- Make sure the code columns in your database have UNIQUE constraints
- For high-concurrency scenarios, consider implementing database-level sequences
