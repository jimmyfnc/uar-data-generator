# CONFIG Usage Audit Report
Generated: 2025-10-26

## Executive Summary

**Total CONFIG Values:** 42
**Used:** 37 (88%)
**Unused/Issues:** 5 (12%)
**Bugs Found:** 1 critical naming mismatch

---

## Critical Issues

### 🔴 BUG: MANAGER_REVIEW_PERCENTAGE naming mismatch

**Severity:** HIGH
**Impact:** Feature not working as intended

**Problem:**
- CONFIG defines: `MANAGER_REVIEW_PERCENTAGE: 0.15`
- Code references: `CONFIG.MANAGER_REVIEWER_PERCENTAGE` (line 849)
- Result: `undefined` is used in comparison, breaking manager review logic

**Fix Required:**
```javascript
// Line 849 - BEFORE:
const isManagerReview = !isAdminReview && !isReassignment &&
                       rng.random() < CONFIG.MANAGER_REVIEWER_PERCENTAGE;

// Line 849 - AFTER:
const isManagerReview = !isAdminReview && !isReassignment &&
                       rng.random() < CONFIG.MANAGER_REVIEW_PERCENTAGE;
```

---

## Unused CONFIG Values Analysis

### 1. ⚠️ SPECIAL_ACCESS_PERCENTAGE (0.20)

**Status:** Partially Used (Implicitly)
**Location:** Line 54
**Issue:** Not directly referenced; calculated as remainder

**Current Implementation:**
```javascript
// Line 1117-1119
const leaverRecordCount = Math.round(CONFIG.RECORD_COUNT * CONFIG.LEAVER_CAMPAIGN_PERCENTAGE);
const quarterlyRecordCount = Math.round(CONFIG.RECORD_COUNT * CONFIG.QUARTERLY_REVIEW_PERCENTAGE);
const specialRecordCount = CONFIG.RECORD_COUNT - leaverRecordCount - quarterlyRecordCount;
```

**Recommendation:** Change to explicit reference for clarity:
```javascript
const specialRecordCount = Math.round(CONFIG.RECORD_COUNT * CONFIG.SPECIAL_ACCESS_PERCENTAGE);
```

**Priority:** LOW (works correctly but less maintainable)

---

### 2. ⚠️ AVG_DEPROVISION_MINUTES (480)

**Status:** Unused
**Location:** Line 87
**Issue:** Deprovision time uses hardcoded ranges instead of calculated values

**Current Implementation:**
```javascript
// Lines 670-682: Uses hardcoded time ranges
if (speedRoll < CONFIG.FAST_DEPROVISION_PERCENTAGE) {
    minutesToDeprovision = rng.randomInt(60, 240);  // Hardcoded
} else if (speedRoll < CONFIG.FAST_DEPROVISION_PERCENTAGE + CONFIG.TYPICAL_DEPROVISION_PERCENTAGE) {
    minutesToDeprovision = rng.randomInt(240, 720);  // Hardcoded
}
// ...etc
```

**Recommendation:** Two options:

**Option A - Remove:** If hardcoded ranges are preferred, remove `AVG_DEPROVISION_MINUTES` from CONFIG

**Option B - Implement:** Use average with variance for more realistic distribution:
```javascript
// Calculate ranges based on AVG and VARIANCE
const fastAvg = CONFIG.AVG_DEPROVISION_MINUTES * 0.3;  // 30% of average
const typicalAvg = CONFIG.AVG_DEPROVISION_MINUTES;
const slowAvg = CONFIG.AVG_DEPROVISION_MINUTES * 2;
const verySlowAvg = CONFIG.AVG_DEPROVISION_MINUTES * 3;

if (speedRoll < CONFIG.FAST_DEPROVISION_PERCENTAGE) {
    minutesToDeprovision = Math.max(CONFIG.MIN_DEPROVISION_MINUTES,
        fastAvg + rng.randomInt(-CONFIG.DEPROVISION_VARIANCE_MINUTES, CONFIG.DEPROVISION_VARIANCE_MINUTES));
}
// ...etc
```

**Priority:** LOW (current hardcoded implementation works well)

---

### 3. ⚠️ DEPROVISION_VARIANCE_MINUTES (360)

**Status:** Unused
**Location:** Line 90
**Issue:** Related to AVG_DEPROVISION_MINUTES (see above)

**Recommendation:** Same as AVG_DEPROVISION_MINUTES - either remove or implement variance-based calculation

**Priority:** LOW

---

### 4. ⚠️ SLOW_DEPROVISION_PERCENTAGE (0.15)

**Status:** Implicitly Used
**Location:** Line 93
**Issue:** Not directly referenced; calculated as remainder

**Current Implementation:**
```javascript
// Line 676: Implicit calculation
} else if (speedRoll < 1 - CONFIG.VERY_SLOW_DEPROVISION_PERCENTAGE) {
    // This IS the slow percentage (15%), but not explicitly using the CONFIG value
    minutesToDeprovision = rng.randomInt(720, 1440);
}
```

**Calculation:**
- FAST: 20%
- TYPICAL: 60%
- SLOW: (implicit) = 1 - FAST - TYPICAL - VERY_SLOW = 1 - 0.20 - 0.60 - 0.05 = 0.15 ✓
- VERY_SLOW: 5%

**Recommendation:** Make explicit for clarity and maintainability:
```javascript
} else if (speedRoll < CONFIG.FAST_DEPROVISION_PERCENTAGE +
                       CONFIG.TYPICAL_DEPROVISION_PERCENTAGE +
                       CONFIG.SLOW_DEPROVISION_PERCENTAGE) {
    // Slow deprovisioning
    minutesToDeprovision = rng.randomInt(720, 1440);
}
```

**Priority:** MEDIUM (improves code clarity and prevents configuration errors)

---

## Summary of Recommendations

### Must Fix (Critical)
1. **Fix MANAGER_REVIEW_PERCENTAGE bug** (line 849) - Change `MANAGER_REVIEWER_PERCENTAGE` to `MANAGER_REVIEW_PERCENTAGE`

### Should Fix (Recommended)
2. **Make SLOW_DEPROVISION_PERCENTAGE explicit** (line 676) - Improves clarity
3. **Make SPECIAL_ACCESS_PERCENTAGE explicit** (line 1119) - Improves clarity

### Optional (Low Priority)
4. **Remove or implement AVG_DEPROVISION_MINUTES** - Currently unused
5. **Remove or implement DEPROVISION_VARIANCE_MINUTES** - Currently unused

---

## All CONFIG Values - Detailed Usage

### Generation Parameters (5 values) - All Used ✅
- `RECORD_COUNT`: 5 uses - record generation, distribution calculations
- `EMPLOYEE_COUNT`: 2 uses - employee generation
- `CAMPAIGN_COUNT`: 2 uses - campaign generation
- `DATE_RANGE_DAYS`: 2 uses - date range calculations
- `RANDOM_SEED`: 4 uses - seeded random generation

### Campaign Distribution (3 values) - 2 Used, 1 Implicit ⚠️
- `LEAVER_CAMPAIGN_PERCENTAGE`: 3 uses ✅
- `QUARTERLY_REVIEW_PERCENTAGE`: 2 uses ✅
- `SPECIAL_ACCESS_PERCENTAGE`: 0 uses (implicit as remainder) ⚠️

### Status & Compliance (2 values) - All Used ✅
- `STATUS_DISTRIBUTION`: 3 uses ✅
- `COMPLIANCE_RATE`: 3 uses ✅

### Output Settings (2 values) - All Used ✅
- `OUTPUT_FORMAT`: 3 uses ✅
- `SUMMARY_ONLY`: 1 use ✅

### Company Info (3 values) - All Used ✅
- `COMPANY_NAME`: 1 use ✅
- `EMAIL_DOMAIN`: 1 use ✅
- `ADMIN_EMAIL`: 1 use ✅

### Reviewer Settings (3 values) - 2 Used, 1 Bug 🔴
- `ADMIN_REVIEWER_PERCENTAGE`: 1 use ✅
- `REASSIGNMENT_PERCENTAGE`: 1 use ✅
- `MANAGER_REVIEW_PERCENTAGE`: 0 uses (BUG: code uses wrong name) 🔴

### SLA Days Settings (6 values) - All Used ✅
- `CERT_SLA_DAYS_MIN`: 1 use ✅
- `CERT_SLA_DAYS_MAX`: 1 use ✅
- `CERT_SLA_DAYS_TYPICAL`: 1 use ✅
- `LEAVER_CAMPAIGN_SLA_DAYS`: 1 use ✅
- `SPECIAL_ACCESS_SLA_DAYS`: 1 use ✅
- `QUARTERLY_REVIEW_SLA_DAYS`: 1 use ✅

### Termination Tracking (10 values) - 8 Used, 2 Unused ⚠️
- `TERMINATION_TRACKING_ENABLED`: 6 uses ✅
- `AVG_DEPROVISION_MINUTES`: 0 uses ⚠️
- `MIN_DEPROVISION_MINUTES`: 2 uses ✅
- `MAX_DEPROVISION_MINUTES`: 2 uses ✅
- `DEPROVISION_VARIANCE_MINUTES`: 0 uses ⚠️
- `FAST_DEPROVISION_PERCENTAGE`: 2 uses ✅
- `TYPICAL_DEPROVISION_PERCENTAGE`: 1 use ✅
- `SLOW_DEPROVISION_PERCENTAGE`: 0 uses (implicit) ⚠️
- `VERY_SLOW_DEPROVISION_PERCENTAGE`: 1 use ✅
- `DEPROVISION_SLA_MINUTES`: 3 uses ✅
- `DEPROVISION_COMPLIANCE_RATE`: 1 use ✅

### Trendline Settings (6 values) - All Used ✅
- `ENABLE_TRENDLINE`: 3 uses ✅
- `PEAK_COMPLIANCE_MONTH`: 2 uses ✅
- `LOW_COMPLIANCE_MONTH`: 2 uses ✅
- `COMPLIANCE_VARIANCE`: 2 uses ✅
- `DEPROVISION_SEASONAL_IMPACT`: 4 uses ✅
- `MONTHLY_COMPLIANCE_WEIGHTS`: 8 uses ✅
- `MONTHLY_DEPROVISION_WEIGHTS`: 8 uses ✅

---

## Testing Verification

To verify all CONFIG values are working as expected:

```bash
# 1. Test current implementation
node uar_data_generator.js --seed 12345 --summary-only

# 2. After fixing MANAGER_REVIEW_PERCENTAGE bug, verify manager reviews appear in output
node uar_data_generator.js --seed 12345 | grep -i "manager"

# 3. Verify all distributions match CONFIG targets
node validate_uar_output.js
```

---

## Audit Methodology Notes

The original `check_config_usage.js` had a logical flaw:
- It searched for `CONFIG.KEY` pattern and subtracted 1 to "exclude definition"
- But CONFIG object definitions use `KEY: value` format (no `CONFIG.` prefix)
- This caused false negatives, reporting used values as unused

The improved `improved_config_audit.js` fixes this by:
- Searching for `CONFIG.KEY` pattern only
- NOT subtracting anything
- Reporting actual usage count

This revealed the true unused values and the naming mismatch bug.
