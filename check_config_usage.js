const fs = require('fs');
const code = fs.readFileSync('uar_data_generator.js', 'utf8');

const configValues = [
    'RECORD_COUNT', 'EMPLOYEE_COUNT', 'CAMPAIGN_COUNT', 'DATE_RANGE_DAYS', 'COMPLIANCE_RATE',
    'RANDOM_SEED', 'LEAVER_CAMPAIGN_PERCENTAGE', 'QUARTERLY_REVIEW_PERCENTAGE', 'SPECIAL_ACCESS_PERCENTAGE',
    'STATUS_DISTRIBUTION', 'OUTPUT_FORMAT', 'SUMMARY_ONLY',
    'COMPANY_NAME', 'EMAIL_DOMAIN', 'ADMIN_EMAIL',
    'ADMIN_REVIEWER_PERCENTAGE', 'REASSIGNMENT_PERCENTAGE', 'MANAGER_REVIEW_PERCENTAGE',
    'CERT_SLA_DAYS_MIN', 'CERT_SLA_DAYS_MAX', 'CERT_SLA_DAYS_TYPICAL',
    'LEAVER_CAMPAIGN_SLA_DAYS', 'SPECIAL_ACCESS_SLA_DAYS', 'QUARTERLY_REVIEW_SLA_DAYS',
    'TERMINATION_TRACKING_ENABLED', 'AVG_DEPROVISION_MINUTES', 'MIN_DEPROVISION_MINUTES',
    'MAX_DEPROVISION_MINUTES', 'DEPROVISION_VARIANCE_MINUTES',
    'FAST_DEPROVISION_PERCENTAGE', 'TYPICAL_DEPROVISION_PERCENTAGE',
    'SLOW_DEPROVISION_PERCENTAGE', 'VERY_SLOW_DEPROVISION_PERCENTAGE',
    'DEPROVISION_SLA_MINUTES', 'DEPROVISION_COMPLIANCE_RATE',
    'ENABLE_TRENDLINE', 'PEAK_COMPLIANCE_MONTH', 'LOW_COMPLIANCE_MONTH',
    'COMPLIANCE_VARIANCE', 'DEPROVISION_SEASONAL_IMPACT',
    'MONTHLY_COMPLIANCE_WEIGHTS', 'MONTHLY_DEPROVISION_WEIGHTS'
];

console.log('CONFIG VALUE USAGE AUDIT');
console.log('='.repeat(70));

const unused = [];
const used = [];

configValues.forEach(key => {
    const regex = new RegExp(`CONFIG\\.${key}`, 'g');
    const matches = code.match(regex);
    const count = matches ? matches.length - 1 : 0; // -1 to exclude definition
    
    if (count === 0) {
        unused.push(key);
        console.log(`❌ UNUSED: ${key}`);
    } else {
        used.push({key, count});
    }
});

console.log('\n' + '='.repeat(70));
console.log(`\nSummary: ${used.length} used, ${unused.length} unused out of ${configValues.length} total\n`);

if (unused.length > 0) {
    console.log('UNUSED CONFIG VALUES:');
    unused.forEach(k => console.log('  - ' + k));
}

console.log('\nMOST USED CONFIG VALUES:');
used.sort((a,b) => b.count - a.count).slice(0, 10).forEach(({key, count}) => {
    console.log(`  ${key}: ${count} times`);
});
