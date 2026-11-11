# UAR Data Generator

Generates realistic, fully synthetic **User Access Review (UAR)** certification data for
building and testing identity-governance compliance dashboards (Tableau, Power BI, etc.)
without touching real employee records.

The hard part of fake compliance data is making the numbers come out right. This
generator hits configurable KPI targets exactly, so a dashboard built against it shows
the metrics you designed for, and the data still looks organic row by row.

## What it produces

- **30,000 certification records** (configurable) across 5,000 synthetic employees and
  40 review campaigns, as CSV.
- **45 columns**: campaign, certification, reviewer and employee fields, compliance
  status, past-due flags, due-in-days, plus ODM tracking columns (termination request,
  deprovision complete, minutes to deprovision, deprovision compliance).
- **Campaign mix**: leaver campaigns, quarterly reviews and special-access reviews in
  configurable proportions.
- **Gartner ODM-style deprovisioning metric**: minutes from termination to access
  removal, measured against a configurable SLA (24 hours by default), with a realistic
  fast / typical / slow / very-slow distribution.

## Exact KPI targeting

Set the targets in the `CONFIG` object at the top of `uar_data_generator.js`:

```javascript
COMPLIANCE_RATE: 0.93,               // overall certification compliance
DEPROVISION_COMPLIANCE_RATE: 0.85,   // terminations deprovisioned within SLA
DEPROVISION_SLA_MINUTES: 1440,       // 24-hour SLA
LEAVER_CAMPAIGN_PERCENTAGE: 0.35,
QUARTERLY_REVIEW_PERCENTAGE: 0.45,
SPECIAL_ACCESS_PERCENTAGE: 0.20,
```

After generating, the script adjusts records until the output lands on the target
(for example 27,900 / 30,000 = 93.00% compliant). See
[VALIDATION_RESULTS.md](VALIDATION_RESULTS.md) for a verified run.

## Usage

Requires Node.js.

```bash
# Write a dataset
node uar_data_generator.js > uar_data.csv

# Reproducible dataset
node uar_data_generator.js --seed 12345 > uar_data.csv

# Print compliance statistics only
node uar_data_generator.js --summary-only
```

## Validation tooling

| File | Purpose |
| --- | --- |
| `validate_uar_output.js` | Runs the generator, saves `uar_output.csv` and computes summary stats from it |
| `comprehensive_validation.sh` | Reports on `uar_output.csv`: column count, compliance and distribution checks |
| `check_config_usage.js`, `improved_config_audit.js` | Confirm every `CONFIG` option is actually used by the generator |

More detail: [CONFIG_SUMMARY.md](CONFIG_SUMMARY.md) and
[CONFIG_AUDIT_REPORT.md](CONFIG_AUDIT_REPORT.md).

## Related

[mfa_data_generator](https://github.com/jimmyfnc/mfa_data_generator): the same approach
for multi-factor authentication sign-in data.
