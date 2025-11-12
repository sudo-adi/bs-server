# CSV Import - Quick Start Guide

## 🚀 Quick Reference

### API Endpoints (Base URL: `http://localhost:3000/api/v1/profiles/import`)

| Action | Endpoint | Method |
|--------|----------|--------|
| Download Candidate Template | `/templates/candidates` | GET |
| Download Worker Template | `/templates/workers` | GET |
| Import Candidates | `/candidates` | POST |
| Import Workers | `/workers` | POST |

---

## 📥 Import Candidates

```bash
curl -X POST http://localhost:3000/api/v1/profiles/import/candidates \
  -F "file=@candidate_data.csv" \
  -F "skipDuplicates=false"
```

**Initial Stage:** `new registration`

---

## 👷 Import Workers

```bash
curl -X POST http://localhost:3000/api/v1/profiles/import/workers \
  -F "file=@worker_data.csv" \
  -F "skipDuplicates=false"
```

**Initial Stage:** `onboarded`

---

## 📋 Download Templates

**Candidate Template:**
```bash
curl http://localhost:3000/api/v1/profiles/import/templates/candidates -o candidate_template.csv
```

**Worker Template:**
```bash
curl http://localhost:3000/api/v1/profiles/import/templates/workers -o worker_template.csv
```

---

## 📝 CSV Format

### Required Fields
- `first_name` - First name
- `phone` - 10-digit phone number (must be unique)

### Optional Fields
- **Personal:** `last_name`, `middle_name`, `fathers_name`, `email`, `gender`, `date_of_birth`
- **Address:** `address_type`, `house_number`, `village_or_city`, `district`, `state`, `postal_code`, etc.
- **Document:** `doc_type`, `doc_number` (e.g., "Aadhar", "123456789012")
- **Bank:** `account_holder_name`, `account_number`, `ifsc_code`, `bank_name`, `account_type`
- **Education:** `qualification_type`, `institution_name`, `field_of_study`, `year_of_completion`
- **Skills:** `skill_category`, `years_of_experience`

---

## 🔄 Auto-Generated Fields

**These are automatically generated - DO NOT include in CSV:**
- `candidate_code` - Format: `BS{timestamp}{random}` (e.g., BS123456789)
- `id` - UUID for profile
- All other IDs (profile_id, document_id, etc.)

---

## 📊 Sample Data

Sample CSV files available at:
- `/server/sample_data/candidate_import_sample.csv` (10 candidates)
- `/server/sample_data/worker_import_sample.csv` (10 workers)

---

## ✅ Stage Flow

### Candidates
```
Import (new registration) → screening → approved
```

### Workers
```
Import (onboarded) → allocated → deployed ⇄ benched
```

---

## 🔒 Import Options

### Skip Duplicates
```bash
-F "skipDuplicates=true"
```
Skips profiles with existing phone numbers.

### Update Existing
```bash
-F "updateExisting=true"
```
Updates existing profiles instead of creating new ones.

---

## ⚠️ Important Notes

1. **Phone Number:** Must be unique and 10 digits
2. **Date Format:** Use `YYYY-MM-DD` (e.g., 1995-05-15)
3. **Gender:** Use `male`, `female`, or `other`
4. **Document Files:** CSV only creates document records with numbers. Upload actual files separately.
5. **File Size:** Maximum 10MB
6. **Timeout:** Large imports (>100 rows) may timeout but will complete successfully

---

## 🧪 Testing

Test with provided sample files:
```bash
# Test candidate import
curl -X POST http://localhost:3000/api/v1/profiles/import/candidates \
  -F "file=@/Users/aditya/Desktop/xyz/server/sample_data/candidate_import_sample.csv"

# Test worker import
curl -X POST http://localhost:3000/api/v1/profiles/import/workers \
  -F "file=@/Users/aditya/Desktop/xyz/server/sample_data/worker_import_sample.csv"
```

---

## 📚 Full Documentation

- **API Documentation:** `/server/docs/CSV_IMPORT_API.md`
- **Test Results:** `/server/docs/CSV_IMPORT_TEST_RESULTS.md`

---

## 🆘 Support

For issues:
1. Check validation errors in API response
2. Verify CSV format matches template
3. Ensure phone numbers are unique
4. Check sample CSV files for reference

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** 2025-11-12
