# CSV Import API Documentation

## Overview

The CSV Import API allows bulk import of candidate and worker profiles from CSV files. The system automatically:
- Generates unique candidate codes (format: `BS{timestamp}{random}`)
- Auto-generates UUIDs for all records
- Creates profiles with associated data (addresses, documents, bank accounts, qualifications, skills)
- Sets appropriate initial stages based on import type

## Endpoints

### 1. Import Candidates

**Endpoint:** `POST /api/profiles/import/candidates`

**Description:** Import multiple candidate profiles from a CSV file. Candidates are set to "new registration" stage.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Headers: Authorization token (if auth is implemented)

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | CSV file to import |
| skipDuplicates | Boolean | No | Skip profiles with existing phone numbers (default: false) |
| updateExisting | Boolean | No | Update existing profiles instead of creating new ones (default: false) |

**Response:**
```json
{
  "success": true,
  "message": "CSV import completed",
  "data": {
    "totalRows": 10,
    "successCount": 8,
    "failureCount": 2,
    "results": [
      {
        "rowNumber": 2,
        "success": true,
        "profileId": "uuid-here",
        "candidateCode": "BS123456789",
        "warnings": []
      },
      {
        "rowNumber": 3,
        "success": false,
        "errors": ["phone: Phone number must be 10 digits"]
      }
    ]
  }
}
```

---

### 2. Import Workers

**Endpoint:** `POST /api/profiles/import/workers`

**Description:** Import multiple worker profiles from a CSV file. Workers are set to "onboarded" stage.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Headers: Authorization token (if auth is implemented)

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | CSV file to import |
| skipDuplicates | Boolean | No | Skip profiles with existing phone numbers (default: false) |
| updateExisting | Boolean | No | Update existing profiles instead of creating new ones (default: false) |

**Response:** Same format as candidate import

---

### 3. Download Candidate Template

**Endpoint:** `GET /api/profiles/import/templates/candidates`

**Description:** Download a CSV template with sample data for candidate imports.

**Response:**
- Content-Type: `text/csv`
- File: `candidate_import_template.csv`

---

### 4. Download Worker Template

**Endpoint:** `GET /api/profiles/import/templates/workers`

**Description:** Download a CSV template with sample data for worker imports.

**Response:**
- Content-Type: `text/csv`
- File: `worker_import_template.csv`

---

## CSV Schema

### Required Fields
- `first_name` - First name of the person
- `phone` - 10-digit mobile number (must be unique)

### Optional Personal Information
- `last_name` - Last name
- `middle_name` - Middle name
- `fathers_name` - Father's name
- `alt_phone` - Alternate phone number
- `email` - Email address (validated format)
- `gender` - Values: `male`, `female`, or `other`
- `date_of_birth` - Format: `YYYY-MM-DD`

### Optional Address Information
- `address_type` - Values: `permanent` or `current`
- `house_number` - House/flat number
- `village_or_city` - Village or city name
- `district` - District name
- `state` - State name
- `postal_code` - PIN code
- `landmark` - Nearby landmark
- `police_station` - Police station name
- `post_office` - Post office name

### Optional Document Information
- `doc_type` - Document type (e.g., "Aadhar", "PAN", "Voter ID")
- `doc_number` - Document number/ID

**Note:** When documents are imported, only the document record with the number is created. The actual file needs to be uploaded separately through the document upload API.

### Optional Bank Account Information
- `account_holder_name` - Name as per bank account
- `account_number` - Bank account number
- `ifsc_code` - IFSC code (required if account_number is provided)
- `bank_name` - Bank name
- `branch_name` - Branch name
- `account_type` - Values: `savings` or `current`

### Optional Qualification Information
- `qualification_type` - Type (e.g., "10th", "12th", "Graduate", "Diploma", "ITI")
- `institution_name` - School/College/University name
- `field_of_study` - Field of study or stream
- `year_of_completion` - Year of completion
- `percentage_or_grade` - Percentage or grade obtained

### Optional Skill Information
- `skill_category` - Skill category name (e.g., "Electrician", "Plumber", "Mason")
- `years_of_experience` - Years of experience (numeric)

---

## Auto-Generated Fields

The following fields are automatically generated and should **NOT** be included in the CSV:

- `candidate_code` - Unique profile code (format: `BS{timestamp}{random}`)
- `id` - UUID for the profile
- All relation IDs (profile_id, document_id, etc.)

---

## Stage Assignment

### Candidates
Imported candidates are automatically assigned to the **"new registration"** stage.

### Workers
Imported workers are automatically assigned to the **"onboarded"** stage.

You can later move profiles through different stages using the stage transition API:
- Candidates: new registration → screening → approved
- Workers: onboarded → allocated → deployed → benched

---

## Validation Rules

### Phone Number
- Must be 10 digits
- Must be unique across all profiles
- Special characters and spaces are automatically removed

### Email
- Must be a valid email format
- Optional field

### Date of Birth
- Must be in `YYYY-MM-DD` format
- Optional field

### Gender
- Must be one of: `male`, `female`, `other` (case-insensitive)
- Optional field

### Bank Account
- If `account_number` is provided, `ifsc_code` and `account_holder_name` are required

---

## Error Handling

### Individual Row Errors
Each row is processed independently. If a row has validation errors or fails to import, it will be marked as failed in the results, but other rows will continue to be processed.

### Common Error Scenarios
1. **Duplicate Phone Number**: If a phone number already exists and `skipDuplicates` is false
2. **Invalid Format**: Phone number, email, or date format is incorrect
3. **Missing Required Fields**: `first_name` or `phone` is missing
4. **Database Constraints**: Foreign key violations or other database errors

---

## Sample CSV Files

Sample CSV files are available in `/server/sample_data/`:
- `candidate_import_sample.csv` - Sample candidates with various data combinations
- `worker_import_sample.csv` - Sample workers with various data combinations

---

## Usage Examples

### Using cURL

**Import Candidates:**
```bash
curl -X POST http://localhost:3000/api/profiles/import/candidates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@candidate_import_sample.csv" \
  -F "skipDuplicates=false"
```

**Import Workers with Skip Duplicates:**
```bash
curl -X POST http://localhost:3000/api/profiles/import/workers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@worker_import_sample.csv" \
  -F "skipDuplicates=true"
```

**Download Template:**
```bash
curl -X GET http://localhost:3000/api/profiles/import/templates/candidates \
  -o candidate_template.csv
```

### Using Postman

1. Set method to `POST`
2. URL: `http://localhost:3000/api/profiles/import/candidates`
3. Headers: Add `Authorization` if required
4. Body:
   - Select `form-data`
   - Add key `file` with type `File`
   - Add optional keys `skipDuplicates` and `updateExisting` with type `Text`
5. Click Send

---

## Best Practices

1. **Always validate your CSV** before importing using the template
2. **Start with small batches** to test the import process
3. **Use skipDuplicates=true** for re-imports to avoid errors
4. **Keep phone numbers unique** - use only one phone number per person
5. **Follow date format strictly** - Use YYYY-MM-DD format
6. **Document files need separate upload** - The CSV only creates document records with numbers
7. **Review import results** - Check the response for any failures or warnings

---

## Limitations

1. **File Size**: Maximum 10MB per CSV file
2. **File Type**: Only `.csv` files are accepted
3. **Document Files**: Actual document files cannot be uploaded via CSV, only document numbers
4. **Images**: Profile photos cannot be uploaded via CSV
5. **Batch Size**: For very large imports (>1000 rows), consider splitting into multiple files

---

## Related APIs

After importing profiles, you can use these APIs to complete the profile:
- `POST /api/profiles/:id/documents` - Upload document files
- `POST /api/profiles/:id/stage` - Change profile stage
- `PATCH /api/profiles/:id` - Update profile information

---

## Technical Details

### Files Modified/Created
- `/server/src/types/csvImport.types.ts` - TypeScript types
- `/server/src/services/profiles/csvImport.service.ts` - Import service logic
- `/server/src/controllers/profiles/csvImport.controller.ts` - API controllers
- `/server/src/routes/profiles/csvImport.routes.ts` - Route definitions
- `/server/src/routes/profiles/index.ts` - Route registration
- `/server/sample_data/candidate_import_sample.csv` - Sample candidate data
- `/server/sample_data/worker_import_sample.csv` - Sample worker data

### Dependencies
- `csv-parse` - CSV parsing library
- `multer` - File upload middleware

---

## Testing

To test the import functionality:

1. Download the appropriate template
2. Fill in the data (or use sample files)
3. Import using Postman or cURL
4. Check the response for success/failure
5. Verify in the database or admin panel

---

## Support

For issues or questions:
1. Check validation errors in the API response
2. Verify CSV format matches the template
3. Review this documentation
4. Contact the development team
