╔══════════════════════════════════════════════════════════════════════╗
║          UAR GENERATOR V3.0 - OPTION A TODO LIST                     ║
║              Wrapper/Transformation Layer Approach                   ║
╚══════════════════════════════════════════════════════════════════════╝

ESTIMATED TIME: 10-12 minutes total

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: ADD DATE FORMATTING FUNCTIONS (2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: After SeededRandom class (~line 183)

Add these functions:
□ formatLongDate(date)     // M/D/YYYY h:mm:ss AM/PM
□ formatShortDate(date)    // M/D/YY
□ formatBoolean(value)     // TRUE/FALSE
□ daysBetween(date1, date2)
□ getUserAccessGrouping(days)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: UPDATE CONFIG FOR MINUTES (1 minute)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: CONFIG object (~line 56-153)

Changes:
□ Line ~104: AVG_DEPROVISION_HOURS: 18 → AVG_DEPROVISION_MINUTES: 480
□ Line ~105: DEPROVISION_VARIANCE_HOURS: 12 → DEPROVISION_VARIANCE_MINUTES: 360
□ Line ~103: Remove SENSITIVE_SYSTEM_PERCENTAGE line
□ Add new config:
  MIN_DEPROVISION_MINUTES: 30
  MAX_DEPROVISION_MINUTES: 2880

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: UPDATE TERMINATION GENERATION LOGIC (2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: generateTerminationTimestamps function (~line 680-750)

Changes:
□ Change hours calculations to minutes
□ Update distribution logic:
  - 20% in 60-240 minutes (1-4 hours)
  - 60% in 240-720 minutes (4-12 hours)
  - 15% in 720-1440 minutes (12-24 hours)
  - 5% in 1440-2880 minutes (24-48 hours)
□ Return minutes instead of hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: CREATE RECORD TRANSFORMATION FUNCTION (3 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: Before generateUARRecord function (~line 650)

Create function: transformRecordToV3(v2Record)

This function should:
□ Convert dates using formatLongDate() and formatShortDate()
□ Convert booleans using formatBoolean()
□ Calculate new fields:
  - Past Due (empty or "Past Due")
  - User Access Grouping ("29+ Days", etc.)
  - Data as of (same as Campaign Load Date)
  - Due in Days (integer)
□ Remove unwanted fields (TOTAL_CERTIFICATIONS, IS_SENSITIVE_SYSTEM)
□ Rename fields to Title Case
□ Reorder to 44 columns in source order

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5: UPDATE COMPLIANCE ADJUSTMENT (1 minute)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: adjustComplianceToTarget function (~line 1200-1280)

Changes:
□ Change comparison from "Compliant" to TRUE
□ Change flipping from "Compliant"/"Not Compliant" to TRUE/FALSE
□ Update console messages to show TRUE/FALSE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6: DEFINE V3 COLUMN ORDER (1 minute)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: After CONFIG object (~line 154)

Add constant:
□ const V3_COLUMN_NAMES = [
    'Campaign Created Datetime',
    'Campaign End Datetime',
    'Campaign Id',
    'Campaign Load Date',
    'Campaign Name',
    'Campaign Status',
    'Certification Completed',
    'Certification Due Date',
    'Certification End Date',
    'Certification Id',
    'Certification Load Date',
    'Certification Name',
    'Certification Start Date',
    'Certification Status',
    'Compliance Status',
    'Employee Email Address',
    'Employee Id',
    'Employee Job Title',
    'Employee Name',
    'Level 3',
    'Is Active Campaign',
    'Is Current',
    'Level 1',
    'Level 5',
    'Level 6',
    'Manager Email Address',
    'Manager Employee Id',
    'Manager Full Name',
    'Past Due',
    'Phase By Sla',
    'Reviewer Mail Id',
    'Reviewer Name',
    'Level 4',
    'Tl Date',
    'Uar Source',
    'Unique Key',
    'User Access Grouping',
    'Level 2',
    'Completed Certifications',
    'Data as of',
    'Due in Days',
    'Termination Request Datetime',
    'Deprovision Complete Datetime',
    'Minutes To Deprovision'
  ];

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7: UPDATE OUTPUT FUNCTIONS (2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: formatRecord and main output section (~line 1100-1150)

Changes:
□ Modify formatRecord() to:
  1. Call transformRecordToV3(record)
  2. Output in new column order
  3. Use V3_COLUMN_NAMES for header
□ Update header output to use V3 column names

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 8: UPDATE HEADER/VERSION INFO (30 seconds)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: Top of file (lines 1-49)

Changes:
□ Line 3: Change to "Version 3.0 - Source Format Aligned + ODM Minutes"
□ Update description comments to mention:
  - TRUE/FALSE format
  - US date format
  - Minutes instead of hours
  - 44 columns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 9: UPDATE STATISTICS OUTPUT (1 minute)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: generateStatistics function (~line 1300-1450)

Changes:
□ Update to show "TRUE/FALSE" instead of "Compliant/Not Compliant"
□ Change "Hours To Deprovision" to "Minutes To Deprovision"
□ Update calculations to divide by 60 for hour display

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 10: TEST AND VERIFY (1-2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test commands:
□ node uar_data_generator_v3.js --summary-only
  Verify:
  - Compliance shows as TRUE/FALSE
  - Shows 44 columns
  - Minutes displayed correctly

□ node uar_data_generator_v3.js --seed 12345 | head -5
  Verify:
  - Header has Title Case names
  - Dates are M/D/YYYY format
  - Booleans are TRUE/FALSE

□ Generate full file and check:
  - 30,000 records
  - 93.00% compliance exactly
  - Minutes To Deprovision populated
  - All new columns present

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Format Verification:
□ Compliance Status: TRUE/FALSE (not "Compliant")
□ Dates: 10/3/2025 12:00:00 AM (not 2025-10-03)
□ Short dates: 10/3/25 (not 2025-10-03)
□ Booleans: TRUE/FALSE (uppercase)
□ Column names: Title Case With Spaces

Content Verification:
□ 44 columns total
□ 4 new columns populated correctly
□ Minutes To Deprovision (30-2880 range)
□ 93.00% compliance exact
□ ~10,500 records with ODM data (35%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETAILED IMPLEMENTATION NOTES:

Each step is designed to be modular - you can test after each change.

Key transformation function structure:

function transformRecordToV3(v2Record) {
    const now = new Date();
    const dueDate = new Date(v2Record.CERTIFICATION_DUE_DATETIME);
    const dueInDays = daysBetween(now, dueDate);
    
    return {
        'Campaign Created Datetime': formatLongDate(v2Record.CAMPAIGN_CREATED_DATETIME),
        'Campaign End Datetime': formatLongDate(v2Record.CAMPAIGN_END_DATETIME),
        'Campaign Id': v2Record.CAMPAIGN_ID,
        'Campaign Load Date': formatShortDate(v2Record.CAMPAIGN_load_date),
        // ... continue for all 44 columns
        'Compliance Status': formatBoolean(v2Record.COMPLIANCE_STATUS === 'Compliant'),
        'Past Due': (dueInDays < 0 && v2Record.CERTIFICATION_STATUS !== 'CLOSED') ? 'Past Due' : '',
        'User Access Grouping': getUserAccessGrouping(dueInDays),
        'Data as of': formatShortDate(v2Record.CAMPAIGN_load_date),
        'Due in Days': dueInDays,
        'Minutes To Deprovision': v2Record.HOURS_TO_DEPROVISION ? Math.round(v2Record.HOURS_TO_DEPROVISION * 60) : ''
    };
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIPS FOR SUCCESS:

1. Make one change at a time
2. Test after each major step
3. Use --summary-only mode for quick verification
4. Keep V2.0 as backup (already have it)
5. Use --seed 12345 for consistent testing

Would you like me to implement these steps now?

---

VERIFICATION SCRIPT (ADDED)
===========================
I added a small verification script `validate_uar_output.js` to this folder. It:

- Runs the generator (`node uar_data_generator.js --seed 12345`) and captures stdout.
- Writes stdout to `uar_output.csv` in the same directory.
- Performs basic parsing and prints summary stats:
  - header column count and sample header
  - number of rows captured
  - detection and counts for a Compliance column (TRUE-like / FALSE-like)
  - simple numeric stats for a "Minutes To Deprovision" column if found

How to run the verification script:

```bash
# from this directory
node validate_uar_output.js
```

Notes:
- The verifier uses a simple CSV split (no advanced quoting handling). It should work for typical generator output but may mis-parse complex quoted fields.
- If the generator currently prints only progress logs (not CSV), the verifier will save whatever stdout it captured and report that no CSV could be parsed.

Next recommended steps:
- If the generator does not emit CSV yet, implement the transformation/output steps in `uar_data_generator.js` as described above (Steps 4-7 in this TODO) and re-run the verifier.
- Once CSV output is correct, we can extend the verifier to be robust (use a CSV parser and add unit tests).
