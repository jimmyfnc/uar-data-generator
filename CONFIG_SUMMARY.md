# UAR Data Generator V3.0 - Configuration Summary

## Key Compliance Targets (All Configurable)

### 1. Record Count & Basic Settings
```javascript
RECORD_COUNT: 30000              // Total UAR records to generate
EMPLOYEE_COUNT: 5000             // Number of unique employees
CAMPAIGN_COUNT: 40               // Number of access review campaigns
```

### 2. Overall Compliance Rate Target
```javascript
COMPLIANCE_RATE: 0.93            // 93% overall compliance target
```
**Current Result:** ✅ 93.00% (27,900 / 30,000)

### 3. ODM Deprovision Compliance Target (NEW in V3.0)
```javascript
DEPROVISION_SLA_MINUTES: 1440              // 24 hours SLA for deprovisioning
DEPROVISION_COMPLIANCE_RATE: 0.85          // 85% of deprovisions meet SLA
```
**Current Result:** ✅ 85.00% (10,483 / 12,333)

This measures how many terminated employees have their access deprovisioned within the 24-hour SLA.

### 4. Campaign Distribution Targets
```javascript
LEAVER_CAMPAIGN_PERCENTAGE: 0.35           // 35% leaver campaigns
QUARTERLY_REVIEW_PERCENTAGE: 0.45          // 45% quarterly reviews
SPECIAL_ACCESS_PERCENTAGE: 0.20            // 20% special access reviews
```
**Current Results:**
- ✅ Leaver: 35.00% (10,500 / 30,000)
- ✅ Quarterly: 45.00% (13,500 / 30,000)
- ✅ Special: 20.00% (6,000 / 30,000)

### 5. Certification Status Distribution Targets
```javascript
STATUS_DISTRIBUTION: {
    'CLOSED': 0.75,              // 75% closed
    'NEW': 0.15,                 // 15% new
    'IN PROGRESS': 0.10          // 10% in progress
}
```
**Current Results:**
- ✅ CLOSED: 75.11% (22,535 / 30,000)
- ✅ NEW: 15.20% (4,561 / 30,000)
- ✅ IN PROGRESS: 9.68% (2,904 / 30,000)

### 6. Deprovision Time Settings
```javascript
AVG_DEPROVISION_MINUTES: 480               // 8 hours average
MIN_DEPROVISION_MINUTES: 30                // 30 minutes minimum
MAX_DEPROVISION_MINUTES: 2880              // 48 hours maximum
FAST_DEPROVISION_PERCENTAGE: 0.20          // 20% in 1-4 hours
TYPICAL_DEPROVISION_PERCENTAGE: 0.60       // 60% in 4-12 hours
SLOW_DEPROVISION_PERCENTAGE: 0.15          // 15% in 12-24 hours
VERY_SLOW_DEPROVISION_PERCENTAGE: 0.05     // 5% in 24-48 hours
```

## How to Change Configuration

Simply edit the CONFIG object in `uar_data_generator.js`:

```javascript
const CONFIG = {
    RECORD_COUNT: 50000,                    // Change to 50,000 records
    COMPLIANCE_RATE: 0.95,                  // Change to 95% compliance
    DEPROVISION_COMPLIANCE_RATE: 0.90,      // Change to 90% deprovision compliance
    DEPROVISION_SLA_MINUTES: 720,           // Change SLA to 12 hours
    // ... etc
};
```

Then regenerate:
```bash
node uar_data_generator.js --seed 12345 > uar_data.csv
```

## Validation

Run the comprehensive validation to verify all targets are met:
```bash
bash comprehensive_validation.sh
```

## Output Columns

**Total: 45 columns**
- 41 standard UAR columns
- 3 ODM tracking columns (Termination Request, Deprovision Complete, Minutes)
- 1 ODM compliance column (Deprovision Compliance Status) - NEW in V3.0

The **Deprovision Compliance Status** column shows TRUE/FALSE based on whether the deprovisioning was completed within the SLA (1440 minutes / 24 hours by default).
