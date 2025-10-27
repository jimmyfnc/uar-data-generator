//==================================================================================
// 🔐 UAR (USER ACCESS REVIEW) DATA GENERATOR WITH CAMPAIGN ANALYTICS
// ✨ Version 3.0 - Source Format Match + ODM Minutes (Complete Rewrite)
//==================================================================================
//
// 📋 MAJOR CHANGES IN V3.0:
// ========================
// ✅ Compliance Status: TRUE/FALSE (not "Compliant"/"Not Compliant")
// ✅ All Booleans: Uppercase TRUE/FALSE
// ✅ Date Format: M/D/YYYY h:mm:ss AM/PM (matches source data)
// ✅ Column Names: Title Case With Spaces (matches source data)
// ✅ Added 4 New Columns: Past Due, User Access Grouping, Data as of, Due in Days
// ✅ ODM Tracking: Minutes To Deprovision (not hours)
// ✅ 44 Columns Total: 41 source + 3 ODM (removed 2 unnecessary columns)
// ✅ 93% Compliance: Exact targeting maintained
//
// 📋 USAGE INSTRUCTIONS:
// =====================
//
// 1. SUMMARY ONLY (Statistics without data):
//    node uar_data_generator.js --summary-only
//    • Shows detailed UAR compliance statistics and analysis
//    • No CSV data output to console (clean, readable results)
//    • Perfect for reviewing metrics and insights
//    • Displays compliance adjustment details
//
// 2. SAVE TO FILE (Recommended):
//    node uar_data_generator.js > uar_data.csv
//
// 3. REPRODUCIBLE DATA:
//    node uar_data_generator.js --seed 12345 > uar_data.csv
//
//==================================================================================

// Import required modules
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Add configuration option for summary-only mode
const CONFIG = {
    // Data generation settings
    RECORD_COUNT: 30000,         // Number of UAR records to generate
    EMPLOYEE_COUNT: 5000,       // Number of unique employees
    CAMPAIGN_COUNT: 40,         // Number of access review campaigns
    DATE_RANGE_DAYS: 360,       // Date range for campaigns (6 months)
    COMPLIANCE_RATE: 0.93,      // Target overall compliance rate
    
    // Reproducible data generation
    RANDOM_SEED: null, // Set to a number (e.g., 12345) for reproducible results, null for random

    // Campaign distribution settings
    LEAVER_CAMPAIGN_PERCENTAGE: 0.35,  // 35% of campaigns are leaver campaigns
    QUARTERLY_REVIEW_PERCENTAGE: 0.45, // 45% are quarterly reviews
    SPECIAL_ACCESS_PERCENTAGE: 0.20,   // 20% are special access reviews
    
    // Status distribution
    STATUS_DISTRIBUTION: {
        'CLOSED': 0.75,    // 75% of certifications are closed
        'NEW': 0.15,       // 15% are new
        'IN PROGRESS': 0.10 // 10% are in progress
    },
    
    // Output settings
    OUTPUT_FORMAT: 'csv',              // Format for data output: 'tsv', 'csv', or 'json'
    SUMMARY_ONLY: false,               // Set to true to show only statistics without data output
    
    // Company structure
    COMPANY_NAME: 'TechCorp Industries',
    EMAIL_DOMAIN: '@techcorp.com',
    ADMIN_EMAIL: 'security_infosec_data@techcorp.com',
    
    // Compliance and reviewer settings
    ADMIN_REVIEWER_PERCENTAGE: 0.15,  // 15% of reviews done by admin
    REASSIGNMENT_PERCENTAGE: 0.08,    // 8% of certifications are reassignments
    MANAGER_REVIEW_PERCENTAGE: 0.15,  // 15% are manager access reviews
    
    // SLA (Service Level Agreement) Settings
    CERT_SLA_DAYS_MIN: 14,            // Minimum days for certification SLA (from start date)
    CERT_SLA_DAYS_MAX: 45,            // Maximum days for certification SLA (from start date)
    CERT_SLA_DAYS_TYPICAL: 30,        // Typical/target days for most certifications
    LEAVER_CAMPAIGN_SLA_DAYS: 7,      // Faster SLA for leaver campaigns (urgent)
    SPECIAL_ACCESS_SLA_DAYS: 21,      // Medium SLA for special access reviews
    QUARTERLY_REVIEW_SLA_DAYS: 35,    // Longer SLA for quarterly bulk reviews
    
    // Gartner ODM - Termination Tracking (V3.0: NOW IN MINUTES!)
    TERMINATION_TRACKING_ENABLED: true,       // Enable termination request/deprovisioning timestamps
    MIN_DEPROVISION_MINUTES: 30,              // 30 minutes minimum
    MAX_DEPROVISION_MINUTES: 2880,            // 48 hours maximum
    FAST_DEPROVISION_PERCENTAGE: 0.20,        // 20% completed in 1-4 hours
    TYPICAL_DEPROVISION_PERCENTAGE: 0.60,     // 60% completed in 4-12 hours
    SLOW_DEPROVISION_PERCENTAGE: 0.15,        // 15% completed in 12-24 hours
    VERY_SLOW_DEPROVISION_PERCENTAGE: 0.05,   // 5% completed in 24-48 hours

    // ODM Deprovision Compliance (NEW for V3.0)
    DEPROVISION_SLA_MINUTES: 1440,            // 24 hours SLA for deprovisioning
    DEPROVISION_COMPLIANCE_RATE: 0.91,        // 85% of deprovisions meet SLA
    
    // Trendline Settings - Seasonal variation over time
    ENABLE_TRENDLINE: true,              // Enable time-based trending in compliance and deprovisioning
    PEAK_COMPLIANCE_MONTH: 2,            // March (0-indexed: 0=Jan, 11=Dec) - post-audit season
    LOW_COMPLIANCE_MONTH: 11,            // December (0-indexed) - holiday season
    COMPLIANCE_VARIANCE: 0.15,           // +/- 15% variance from baseline over the year
    DEPROVISION_SEASONAL_IMPACT: 0.30,   // Seasonal impact on deprovisioning speed (30% variance)
    
    // Monthly Trendline Weights (optional) - Custom compliance multipliers per month
    // Set to null to use automatic sinusoidal pattern, or provide array of 12 values (Jan-Dec)
    // Values > 1.0 = higher compliance, < 1.0 = lower compliance
    // Pattern: High compliance after audits (Q1), dips in summer and holidays
    MONTHLY_COMPLIANCE_WEIGHTS: [
        1.08,  // Jan - Post-holiday catch-up, new year focus
        1.12,  // Feb - Pre-audit preparation
        1.15,  // Mar - Peak audit season compliance
        1.10,  // Apr - Post-audit momentum
        1.02,  // May - Normal operations
        0.95,  // Jun - Summer vacation season begins
        0.88,  // Jul - Mid-summer, vacation peak
        0.92,  // Aug - Late summer, back-to-work prep
        1.00,  // Sep - Back to normal operations
        1.05,  // Oct - Q4 push, year-end prep
        0.98,  // Nov - Thanksgiving disruption
        0.82   // Dec - Holiday season low
    ],
    
    // Monthly Deprovisioning Speed Weights (optional) - Custom speed multipliers per month
    // Set to null to use automatic pattern, or provide array of 12 values (Jan-Dec)
    // Values > 1.0 = slower deprovisioning, < 1.0 = faster deprovisioning
    // Pattern: Faster in high-activity periods, slower during holidays/vacations
    MONTHLY_DEPROVISION_WEIGHTS: [
        0.85,  // Jan - Fast: Post-holiday catch-up urgency
        0.80,  // Feb - Fast: Audit prep, tight controls
        0.75,  // Mar - Fastest: Peak audit compliance mode
        0.90,  // Apr - Fast: Maintaining momentum
        1.00,  // May - Normal speed
        1.15,  // Jun - Slower: Vacation season begins
        1.35,  // Jul - Slowest: Peak vacation, reduced staffing
        1.25,  // Aug - Slow: Still vacation season
        1.05,  // Sep - Slightly slow: Transition period
        0.95,  // Oct - Normal to fast: Year-end push
        1.20,  // Nov - Slow: Holiday prep, Thanksgiving
        1.45   // Dec - Slowest: Holidays, change freezes, skeleton crews
    ]
};

// ========== V3 COLUMN NAMES (45 COLUMNS IN SOURCE ORDER) ==========
const V3_COLUMN_NAMES = [
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
    'Is Active Campaign',
    'Is Current',
    'Level 1',
    'Level 2',
    'Level 3',
    'Level 4',
    'Level 5',
    'Level 6',
    'Manager Email Address',
    'Manager Employee Id',
    'Manager Full Name',
    'Past Due',
    'Phase By Sla',
    'Reviewer Mail Id',
    'Reviewer Name',  
    'Tl Date',
    'Uar Source',
    'Unique Key',
    'User Access Grouping',
    'Completed Certifications',
    'Total Certifications',
    'Data as of',
    'Due in Days',
    'Termination Request Datetime',
    'Deprovision Complete Datetime',
    'Minutes To Deprovision',
    'Deprovision Compliance Status'
];

// ========== SEEDED RANDOM NUMBER GENERATOR ==========
class SeededRandom {
    constructor(seed) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }
    
    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
    
    random() {
        return this.next();
    }
    
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min)) + min;
    }
    
    randomFromArray(arr) {
        return arr[Math.floor(this.random() * arr.length)];
    }
    
    randomDate(start, end) {
        return new Date(start.getTime() + this.random() * (end.getTime() - start.getTime()));
    }
}

// ========== SAMPLE DATA ARRAYS ==========
const SAMPLE_DATA = {
    firstNames: [
        // Popular names (repeated for realistic distribution)
        'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
        'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
        'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
        'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
        'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Edward', 'Deborah',
        'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia',
        'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Shirley', 'Eric', 'Angela', 'Jonathan', 'Helen',
        'Stephen', 'Anna', 'Larry', 'Brenda', 'Justin', 'Pamela', 'Scott', 'Nicole', 'Brandon', 'Emma',
        'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra', 'Frank', 'Rachel',
        'Alexander', 'Catherine', 'Patrick', 'Carolyn', 'Raymond', 'Janet', 'Jack', 'Ruth', 'Dennis', 'Maria',
        'Jerry', 'Heather', 'Tyler', 'Diane', 'Aaron', 'Virginia', 'Jose', 'Julie', 'Adam', 'Joyce',
        'Henry', 'Victoria', 'Nathan', 'Olivia', 'Douglas', 'Kelly', 'Zachary', 'Christina', 'Peter', 'Lauren',
        'Kyle', 'Joan', 'Walter', 'Evelyn', 'Ethan', 'Judith', 'Jeremy', 'Megan', 'Harold', 'Cheryl',
        'Keith', 'Andrea', 'Christian', 'Hannah', 'Roger', 'Martha', 'Noah', 'Jacqueline', 'Gerald', 'Frances',
        'Carl', 'Gloria', 'Terry', 'Ann', 'Sean', 'Teresa', 'Austin', 'Kathryn', 'Arthur', 'Sara',
        'Lawrence', 'Janice', 'Jesse', 'Jean', 'Dylan', 'Alice', 'Bryan', 'Madison', 'Joe', 'Doris',
        'Jordan', 'Abigail', 'Billy', 'Julia', 'Bruce', 'Judy', 'Albert', 'Grace', 'Willie', 'Denise',
        'Gabriel', 'Amber', 'Logan', 'Brittany', 'Alan', 'Danielle', 'Juan', 'Rose', 'Wayne', 'Diana',
        'Roy', 'Natalie', 'Ralph', 'Sophia', 'Randy', 'Alexis', 'Eugene', 'Lori', 'Vincent', 'Kayla',
        'Russell', 'Jane', 'Elijah', 'Eleanor', 'Louis', 'Marilyn', 'Philip', 'Beverly', 'Bobby', 'Amber',
        'Johnny', 'Danielle', 'Bradley', 'Theresa', 'Antonio', 'Sofia', 'Phillip', 'Diana', 'Carlos', 'Janice',
        // Additional diverse names for larger datasets
        'Mason', 'Isabella', 'Lucas', 'Mia', 'Liam', 'Charlotte', 'Oliver', 'Amelia', 'Elijah', 'Ava',
        'Logan', 'Harper', 'Aiden', 'Ella', 'Jackson', 'Aria', 'Sebastian', 'Scarlett', 'Carter', 'Chloe',
        'Jayden', 'Grace', 'Connor', 'Lily', 'Owen', 'Zoe', 'Caleb', 'Penelope', 'Isaac', 'Nora',
        'Cameron', 'Riley', 'Evan', 'Addison', 'Landon', 'Layla', 'Hunter', 'Lillian', 'Adrian', 'Natalie',
        'Wyatt', 'Camila', 'Dominic', 'Savannah', 'Xavier', 'Brooklyn', 'Jaxon', 'Leah', 'Julian', 'Aubrey',
        'Levi', 'Stella', 'Isaiah', 'Aurora', 'Eli', 'Skylar', 'Aaron', 'Bella', 'Ian', 'Claire',
        'Colton', 'Paisley', 'Nolan', 'Everly', 'Gavin', 'Anna', 'Chase', 'Caroline', 'Leo', 'Nova',
        'Lincoln', 'Genesis', 'Blake', 'Emilia', 'Sawyer', 'Kennedy', 'Easton', 'Maya', 'Bennett', 'Willow',
        'Miles', 'Kinsley', 'Micah', 'Naomi', 'Damian', 'Aaliyah', 'Maxwell', 'Elena', 'Tristan', 'Sarah',
        'Wesley', 'Ariana', 'Cole', 'Allison', 'Axel', 'Gabriella', 'Brody', 'Alice', 'Dean', 'Madelyn',
        // International names for diversity
        'Wei', 'Priya', 'Mohammed', 'Fatima', 'Carlos', 'Ana', 'Ahmed', 'Aisha', 'Chen', 'Yuki',
        'Raj', 'Sanaa', 'Omar', 'Zara', 'Hassan', 'Laila', 'Ali', 'Yasmin', 'Ibrahim', 'Noor',
        'Kai', 'Mei', 'Jun', 'Sakura', 'Hiroshi', 'Akiko', 'Ravi', 'Ananya', 'Arjun', 'Diya',
        'Jorge', 'Lucia', 'Diego', 'Carmen', 'Pablo', 'Rosa', 'Miguel', 'Elena', 'Luis', 'Isabel'
    ],
    
    lastNames: [
        // Common surnames (realistic frequency)
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
        'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
        'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
        'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
        'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
        'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
        'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
        'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
        'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez',
        // Additional surnames for variety
        'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes',
        'Gonzales', 'Fisher', 'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham',
        'Reynolds', 'Griffin', 'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant', 'Herrera', 'Gibson',
        'Ellis', 'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray', 'Ford', 'Castro', 'Marshall', 'Owens',
        'Harrison', 'Fernandez', 'McDonald', 'Woods', 'Washington', 'Kennedy', 'Wells', 'Vargas', 'Henry', 'Chen',
        'Freeman', 'Webb', 'Tucker', 'Guzman', 'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter',
        'Gordon', 'Mendez', 'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz', 'Hunt', 'Hicks',
        'Holmes', 'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd', 'Rose', 'Stone', 'Salazar', 'Fox',
        'Warren', 'Mills', 'Meyer', 'Rice', 'Schmidt', 'Garza', 'Daniels', 'Ferguson', 'Nichols', 'Stephens',
        'Soto', 'Weaver', 'Ryan', 'Gardner', 'Payne', 'Grant', 'Dunn', 'Kelley', 'Spencer', 'Hawkins',
        // Less common but realistic surnames
        'Arnold', 'Pierce', 'Vazquez', 'Hansen', 'Peters', 'Santos', 'Hart', 'Bradley', 'Knight', 'Elliott',
        'Cunningham', 'Duncan', 'Armstrong', 'Hudson', 'Carroll', 'Lane', 'Riley', 'Andrews', 'Alvarado', 'Ray',
        'Delgado', 'Berry', 'Perkins', 'Hoffman', 'Johnston', 'Matthews', 'Pena', 'Richards', 'Contreras', 'Willis',
        'Carpenter', 'Lawrence', 'Sandoval', 'Guerrero', 'George', 'Chapman', 'Rios', 'Estrada', 'Ortega', 'Watkins',
        'Greene', 'Nunez', 'Wheeler', 'Valdez', 'Harper', 'Burke', 'Larson', 'Santiago', 'Maldonado', 'Morrison',
        // Additional names from original list
        'McCrainey', 'Byram', 'Rees', 'Kerns', 'Mustard', 'Atkins', 'Bullock', 'Lang', 'Turpen', 'Duffey',
        'Munger', 'Sygman', 'Guastello', 'Beckwith', 'Luther', 'Petersen', 'Grace', 'Shackelford', 'Gasper', 'Oursler',
        'Bierbaum', 'Carver', 'Niebylski', 'Flagler', 'Sweeney', 'Schottman', 'Sinclair', 'Paladugu'
    ],
    
    // Campaign name patterns based on sample data
    campaignTypes: [
        {
            type: 'leaver',
            patterns: [
                'Leaver Campaign for {employee_name} (Emp ID: {emp_id})',
            ]
        },
        {
            type: 'quarterly',
            patterns: [
                'Quarterly Access Review - {year} Q{quarter} ({timestamp})',
                'Quarterly Access Review Group {group} - {year} Q{quarter} ({timestamp})',
                'Quarterly Access Review for {department} - {year} Q{quarter} ({timestamp})'
            ]
        },
        {
            type: 'special',
            patterns: [
                'Kiteworks User Access (Accellion)',
                'Accellion Kiteworks User Access',
                'Electronic Payment System Access Review {year}',
                'Facets Online Training',
                'Local Workstation Admin Rights',
                'Filebound access campaign v2',
                'Privileged Access {year}',
                'Exclude for A-Admin with filters'
            ]
        }
    ],
    
    departments: [
        'Sales, Product, and Customer Experience',
        'Technology and Digital Transformation',
        'Financial Services Group',
        'Human Resources',
        'Office of the CEO',
        'Innovation and Service Delivery',
        'Strategic Healthcare Solutions',
        'Audit, Compliance, Risk Management',
        'Cobalt Health Solutions'
    ],
    
    groups: ['A', 'B', 'C'],
    
    // Status values based on sample data
    statuses: ['CLOSED', 'NEW', 'IN PROGRESS'],
    
    // Campaign status values
    campaignStatuses: ['STAGED', 'ACTIVE', 'COMPLETED'],
    
    // Source systems
    sources: ['sailpoint_identitynow'],
    
    // Job titles for employees
    jobTitles: [
        'Software Engineer', 'Senior Software Engineer', 'Lead Software Engineer', 'Principal Engineer',
        'Product Manager', 'Senior Product Manager', 'Director of Product', 'VP of Product',
        'Data Analyst', 'Senior Data Analyst', 'Data Scientist', 'Lead Data Scientist',
        'Business Analyst', 'Senior Business Analyst', 'Program Manager', 'Project Manager',
        'DevOps Engineer', 'Site Reliability Engineer', 'Security Engineer', 'Network Engineer',
        'Sales Representative', 'Account Executive', 'Sales Manager', 'Director of Sales',
        'Marketing Specialist', 'Marketing Manager', 'Director of Marketing', 'VP of Marketing',
        'Financial Analyst', 'Senior Financial Analyst', 'Finance Manager', 'Controller',
        'HR Specialist', 'HR Business Partner', 'HR Manager', 'Director of HR',
        'Operations Manager', 'Operations Analyst', 'VP of Operations', 'COO',
        'Compliance Officer', 'Risk Analyst', 'Audit Manager', 'Director of Compliance',
        'Customer Success Manager', 'Support Engineer', 'Technical Writer', 'QA Engineer'
    ],
    
    // Organizational hierarchy (6 levels)
    orgHierarchy: {
        level1: ['Jane Smith'], // CEO
        level2: ['John Davis', 'Sarah Johnson', 'Michael Chen'], // Executive VPs
        level3: ['Robert Taylor', 'Lisa Anderson', 'David Martinez', 'Emily White', 'James Brown'], // Senior VPs
        level4: ['Christopher Lee', 'Jennifer Garcia', 'Matthew Wilson', 'Amanda Rodriguez', 'Daniel Lopez', 'Jessica Hernandez', 'William Thomas', 'Michelle Moore'], // VPs/Directors
        level5: ['Andrew Jackson', 'Stephanie Martin', 'Joshua Thompson', 'Nicole Harris', 'Anthony Clark', 'Elizabeth Lewis', 'Mark Robinson', 'Helen Walker'], // Managers
        level6: null // Individual contributors (pulled from employee pool)
    },
    
    // Common reviewer patterns
    commonReviewers: [
        'Kim White',
        'Denise Lawson', 
        'Melissa Jackson',
        'Lorraine Groves',
        'Teresa Beatty',
        'Kesha King'
    ],
    
    // Admin reviewer identifier
    adminReviewer: 'techcorp_admin'
};

// ========== UTILITY FUNCTIONS ==========
function randomFromArray(arr, rng) {
    return arr[Math.floor(rng.random() * arr.length)];
}

// ========== DATE FORMATTING FUNCTIONS (V3.0: US FORMAT) ==========

/**
 * Format date as M/D/YYYY h:mm:ss AM/PM
 * Example: 10/3/2025 12:00:00 AM
 */
function formatLongDateTime(date) {
    if (!date) return '';

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Format date as M/D/YY (short format)
 * Example: 10/3/25
 */
function formatShortDate(date) {
    if (!date) return '';

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear().toString().substr(2, 2);

    return `${month}/${day}/${year}`;
}

/**
 * Format boolean as TRUE/FALSE (uppercase)
 */
function formatBoolean(value) {
    return value ? 'TRUE' : 'FALSE';
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2 - date1) / oneDay);
}

/**
 * Calculate User Access Grouping based on days
 */
function getUserAccessGrouping(daysUntilDue) {
    if (daysUntilDue < 0) return 'Past Due';
    if (daysUntilDue <= 7) return '0-7 Days';
    if (daysUntilDue <= 14) return '8-14 Days';
    if (daysUntilDue <= 28) return '15-28 Days';
    return '29+ Days';
}

// Keep old formatters for backward compatibility in internal logic
function formatDateTime(date) {
    return formatLongDateTime(date);
}

function formatDate(date) {
    return formatShortDate(date);
}

function generateEmployeeId() {
    return Math.floor(Math.random() * 900000) + 100000; // 6-digit employee ID
}

function generateUsername(firstName, lastName) {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
}

function generateEmail(firstName, lastName) {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${CONFIG.EMAIL_DOMAIN}`;
}

function generateCertificationId(rng) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars[Math.floor(rng.random() * chars.length)];
    }
    return result;
}

function generateTimestamp(date, rng) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(rng.randomInt(0, 23)).padStart(2, '0');
    const minute = String(rng.randomInt(0, 59)).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}`;
}

function generateTimeValue(rng) {
    // Generate time in format like "30:30.2" or "19:15.6"
    const minutes = rng.randomInt(0, 59);
    const seconds = rng.randomInt(0, 59);
    const decimal = rng.randomInt(0, 9);
    return `${minutes}:${String(seconds).padStart(2, '0')}.${decimal}`;
}

// Generate Campaign ID
function generateCampaignId(rng) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = 'CAMP-';
    for (let i = 0; i < 8; i++) {
        result += chars[Math.floor(rng.random() * chars.length)];
    }
    return result;
}

// Generate Unique ID hash (MD5)
function generateUniqueId(campaignName, certificationName, certificationId, campaignId, employeeId, employeeName, employeeEmail) {
    const str = `${campaignName}${certificationName}${certificationId}${campaignId}${employeeId}${employeeName}${employeeEmail}`;
    return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
}

// Get trendline date (first day of month)
function getTLDate(date) {
    const tlDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const month = String(tlDate.getMonth() + 1).padStart(2, '0');
    const day = String(tlDate.getDate()).padStart(2, '0');
    const year = tlDate.getFullYear();
    return `${month}/${day}/${year}`;
}

// Build hierarchical org structure with proper reporting relationships
function buildOrgHierarchy() {
    // Define the org hierarchy with explicit reporting relationships
    const orgStructure = {
        level1: { name: 'Jane Smith', children: [] }, // CEO
        level2: [
            { name: 'John Davis', parent: 'Jane Smith', children: [] },
            { name: 'Sarah Johnson', parent: 'Jane Smith', children: [] },
            { name: 'Michael Chen', parent: 'Jane Smith', children: [] }
        ],
        level3: [
            { name: 'Robert Taylor', parent: 'John Davis', children: [] },
            { name: 'Lisa Anderson', parent: 'John Davis', children: [] },
            { name: 'David Martinez', parent: 'Sarah Johnson', children: [] },
            { name: 'Emily White', parent: 'Sarah Johnson', children: [] },
            { name: 'James Brown', parent: 'Michael Chen', children: [] }
        ],
        level4: [
            { name: 'Christopher Lee', parent: 'Robert Taylor', children: [] },
            { name: 'Jennifer Garcia', parent: 'Robert Taylor', children: [] },
            { name: 'Matthew Wilson', parent: 'Lisa Anderson', children: [] },
            { name: 'Amanda Rodriguez', parent: 'Lisa Anderson', children: [] },
            { name: 'Daniel Lopez', parent: 'David Martinez', children: [] },
            { name: 'Jessica Hernandez', parent: 'David Martinez', children: [] },
            { name: 'William Thomas', parent: 'Emily White', children: [] },
            { name: 'Michelle Moore', parent: 'James Brown', children: [] }
        ],
        level5: [
            { name: 'Andrew Jackson', parent: 'Christopher Lee' },
            { name: 'Stephanie Martin', parent: 'Christopher Lee' },
            { name: 'Joshua Thompson', parent: 'Jennifer Garcia' },
            { name: 'Nicole Harris', parent: 'Matthew Wilson' },
            { name: 'Anthony Clark', parent: 'Amanda Rodriguez' },
            { name: 'Elizabeth Lewis', parent: 'Daniel Lopez' },
            { name: 'Mark Robinson', parent: 'Jessica Hernandez' },
            { name: 'Helen Walker', parent: 'William Thomas' }
        ]
    };

    // Build lookup maps for quick access
    const level2Map = {};
    const level3Map = {};
    const level4Map = {};
    const level5Map = {};
    
    orgStructure.level2.forEach(l2 => {
        level2Map[l2.name] = l2;
        orgStructure.level1.children.push(l2.name);
    });
    
    orgStructure.level3.forEach(l3 => {
        level3Map[l3.name] = l3;
        if (level2Map[l3.parent]) {
            level2Map[l3.parent].children.push(l3.name);
        }
    });
    
    orgStructure.level4.forEach(l4 => {
        level4Map[l4.name] = l4;
        if (level3Map[l4.parent]) {
            level3Map[l4.parent].children.push(l4.name);
        }
    });
    
    orgStructure.level5.forEach(l5 => {
        level5Map[l5.name] = l5;
        if (level4Map[l5.parent]) {
            level4Map[l5.parent].children = level4Map[l5.parent].children || [];
            level4Map[l5.parent].children.push(l5.name);
        }
    });
    
    return {
        structure: orgStructure,
        maps: { level2Map, level3Map, level4Map, level5Map }
    };
}

// Get organizational hierarchy for employee with proper reporting structure
function getOrgHierarchy(rng, orgHierarchyData) {
    const { structure, maps } = orgHierarchyData;
    
    // Start from bottom: randomly pick a Level 5 (manager)
    const level5Person = randomFromArray(structure.level5, rng);
    const level5 = level5Person.name;
    const level6 = level5; // Level 6 is same as Level 5 (employee reports to this manager)
    
    // Walk up the hierarchy to find Level 4
    const level4Person = maps.level4Map[level5Person.parent];
    const level4 = level4Person.name;
    
    // Walk up to find Level 3
    const level3Person = maps.level3Map[level4Person.parent];
    const level3 = level3Person.name;
    
    // Walk up to find Level 2
    const level2Person = maps.level2Map[level3Person.parent];
    const level2 = level2Person.name;
    
    // Level 1 is always the CEO
    const level1 = structure.level1.name;
    
    return { 
        level1, 
        level2, 
        level3, 
        level4, 
        level5, 
        level6, 
        manager: level6 
    };
}


// Calculate seasonal trend factor based on date (0.0 to 1.0 scale)
// Returns higher values during peak compliance season, lower during holiday season
function getSeasonalComplianceFactor(date) {
    if (!CONFIG.ENABLE_TRENDLINE) return 1.0;
    
    const month = date.getMonth(); // 0-11
    
    // Use custom monthly weights if configured
    if (CONFIG.MONTHLY_COMPLIANCE_WEIGHTS && Array.isArray(CONFIG.MONTHLY_COMPLIANCE_WEIGHTS)) {
        if (CONFIG.MONTHLY_COMPLIANCE_WEIGHTS.length === 12) {
            return CONFIG.MONTHLY_COMPLIANCE_WEIGHTS[month];
        } else {
            console.warn('MONTHLY_COMPLIANCE_WEIGHTS must have exactly 12 values. Using automatic pattern.');
        }
    }
    
    // Otherwise use automatic sinusoidal pattern
    const peakMonth = CONFIG.PEAK_COMPLIANCE_MONTH;
    const lowMonth = CONFIG.LOW_COMPLIANCE_MONTH;
    
    // Calculate distance from peak and low months (circular distance for months)
    let distanceFromPeak = Math.abs(month - peakMonth);
    if (distanceFromPeak > 6) distanceFromPeak = 12 - distanceFromPeak;
    
    // Create sinusoidal pattern: peak at peakMonth, low at lowMonth
    const normalizedPosition = (month - peakMonth + 12) % 12;
    const radians = (normalizedPosition / 12) * 2 * Math.PI;
    
    // Sinusoidal wave: 1.0 at peak, moving to lower values
    const seasonalFactor = (Math.cos(radians) + 1) / 2; // Range 0.0 to 1.0
    
    // Apply variance to create the actual multiplier
    // At peak: 1 + variance, at low: 1 - variance
    const multiplier = 1 + (CONFIG.COMPLIANCE_VARIANCE * (seasonalFactor * 2 - 1));
    
    return multiplier;
}

// Calculate seasonal impact on deprovisioning speed
// Returns multiplier for deprovisioning hours (higher = slower during busy periods)
function getSeasonalDeprovisionFactor(date) {
    if (!CONFIG.ENABLE_TRENDLINE) return 1.0;
    
    const month = date.getMonth();
    
    // Use custom monthly weights if configured
    if (CONFIG.MONTHLY_DEPROVISION_WEIGHTS && Array.isArray(CONFIG.MONTHLY_DEPROVISION_WEIGHTS)) {
        if (CONFIG.MONTHLY_DEPROVISION_WEIGHTS.length === 12) {
            return CONFIG.MONTHLY_DEPROVISION_WEIGHTS[month];
        } else {
            console.warn('MONTHLY_DEPROVISION_WEIGHTS must have exactly 12 values. Using automatic pattern.');
        }
    }
    
    // Otherwise use automatic pattern
    // Deprovisioning is slower during:
    // - End of year (Nov-Dec): holidays, freezes
    // - Mid-year (Jun-Jul): vacation season
    // - Faster during: Jan-Feb (post-holiday catch-up), Mar-Apr (audit prep)
    
    const busyMonths = [5, 6, 10, 11]; // June, July, November, December (0-indexed)
    const efficientMonths = [0, 1, 2, 3]; // January, February, March, April
    
    let impactMultiplier = 1.0;
    
    if (busyMonths.includes(month)) {
        // Slower during busy periods
        impactMultiplier = 1 + (CONFIG.DEPROVISION_SEASONAL_IMPACT * 0.7);
    } else if (efficientMonths.includes(month)) {
        // Faster during efficient periods
        impactMultiplier = 1 - (CONFIG.DEPROVISION_SEASONAL_IMPACT * 0.5);
    } else {
        // Slight variation in other months
        const variation = Math.sin((month / 12) * Math.PI * 2) * 0.15;
        impactMultiplier = 1 + (variation * CONFIG.DEPROVISION_SEASONAL_IMPACT);
    }
    
    return impactMultiplier;
}

// Generate termination request and deprovisioning timestamps
// Generate termination request and deprovisioning timestamps (V3.0: NOW IN MINUTES!)
function generateTerminationTimestamps(baseDate, campaignType, rng) {
    if (!CONFIG.TERMINATION_TRACKING_ENABLED) {
        return {
            terminationRequestTime: '',
            deprovisionCompleteTime: '',
            minutesToDeprovision: '',
            deprovisionCompliance: null
        };
    }

    // Only generate termination data for leaver campaigns and some special access reviews
    const shouldTrackTermination = campaignType === 'leaver' ||
                                   (campaignType === 'special' && rng.random() < 0.3);

    if (!shouldTrackTermination) {
        return {
            terminationRequestTime: '',
            deprovisionCompleteTime: '',
            minutesToDeprovision: '',
            deprovisionCompliance: null
        };
    }

    // Generate termination request timestamp (within the date range)
    const terminationDate = new Date(baseDate);
    const requestHour = rng.randomInt(8, 17); // Business hours 8 AM - 5 PM
    const requestMinute = rng.randomInt(0, 59);
    terminationDate.setHours(requestHour, requestMinute, 0, 0);

    // Calculate deprovisioning time in MINUTES (V3.0 change)
    let minutesToDeprovision;
    const speedRoll = rng.random();

    if (speedRoll < CONFIG.FAST_DEPROVISION_PERCENTAGE) {
        // Fast deprovisioning: 60-240 minutes (1-4 hours)
        minutesToDeprovision = rng.randomInt(60, 240);
    } else if (speedRoll < CONFIG.FAST_DEPROVISION_PERCENTAGE + CONFIG.TYPICAL_DEPROVISION_PERCENTAGE) {
        // Typical deprovisioning: 240-720 minutes (4-12 hours)
        minutesToDeprovision = rng.randomInt(240, 720);
    } else if (speedRoll < CONFIG.FAST_DEPROVISION_PERCENTAGE + CONFIG.TYPICAL_DEPROVISION_PERCENTAGE + CONFIG.SLOW_DEPROVISION_PERCENTAGE) {
        // Slow deprovisioning: 720-1440 minutes (12-24 hours)
        minutesToDeprovision = rng.randomInt(720, 1440);
    } else if (speedRoll < CONFIG.FAST_DEPROVISION_PERCENTAGE + CONFIG.TYPICAL_DEPROVISION_PERCENTAGE + CONFIG.SLOW_DEPROVISION_PERCENTAGE + CONFIG.VERY_SLOW_DEPROVISION_PERCENTAGE) {
        // Very slow deprovisioning: 1440-2880 minutes (24-48 hours)
        minutesToDeprovision = rng.randomInt(1440, 2880);
    }

    // Apply seasonal trendline factor to deprovisioning time
    const seasonalFactor = getSeasonalDeprovisionFactor(terminationDate);
    minutesToDeprovision = Math.max(CONFIG.MIN_DEPROVISION_MINUTES,
                                     Math.min(CONFIG.MAX_DEPROVISION_MINUTES,
                                              Math.round(minutesToDeprovision * seasonalFactor)));

    // Calculate deprovisioning complete time
    const deprovisionDate = new Date(terminationDate.getTime() + (minutesToDeprovision * 60 * 1000));

    // Determine if deprovision met SLA
    const deprovisionCompliance = minutesToDeprovision <= CONFIG.DEPROVISION_SLA_MINUTES;

    return {
        terminationRequestTime: formatDateTime(terminationDate),
        deprovisionCompleteTime: formatDateTime(deprovisionDate),
        minutesToDeprovision: minutesToDeprovision.toString(),
        deprovisionCompliance: deprovisionCompliance
    };
}

function createEmployeePool(employeeCount, rng) {
    const employees = [];
    
    // Build the hierarchical org structure
    const orgHierarchyData = buildOrgHierarchy();
    
    for (let i = 0; i < employeeCount; i++) {
        const firstName = randomFromArray(SAMPLE_DATA.firstNames, rng);
        const lastName = randomFromArray(SAMPLE_DATA.lastNames, rng);
        const empId = generateEmployeeId();
        const orgHierarchy = getOrgHierarchy(rng, orgHierarchyData);
        const jobTitle = randomFromArray(SAMPLE_DATA.jobTitles, rng);
        
        // Generate manager info
        const managerEmpId = generateEmployeeId();
        
        const employee = {
            name: `${firstName} ${lastName}`,
            firstName: firstName,
            lastName: lastName,
            email: generateEmail(firstName, lastName),
            username: generateUsername(firstName, lastName),
            empId: empId,
            jobTitle: jobTitle,
            managerName: orgHierarchy.manager,
            managerEmail: generateEmail(orgHierarchy.manager.split(' ')[0], orgHierarchy.manager.split(' ')[1]),
            managerEmpId: managerEmpId,
            level1: orgHierarchy.level1,
            level2: orgHierarchy.level2,
            level3: orgHierarchy.level3,
            level4: orgHierarchy.level4,
            level5: orgHierarchy.level5,
            level6: orgHierarchy.level6
        };
        employees.push(employee);
    }
    
    return employees;
}

function createCampaigns(campaignCount, employees, rng) {
    const campaigns = [];
    const now = new Date();
    const startDate = new Date(now.getTime() - (CONFIG.DATE_RANGE_DAYS * 24 * 60 * 60 * 1000));
    
    for (let i = 0; i < campaignCount; i++) {
        const rand = rng.random();
        let campaignType;
        
        if (rand < CONFIG.LEAVER_CAMPAIGN_PERCENTAGE) {
            campaignType = 'leaver';
        } else if (rand < CONFIG.LEAVER_CAMPAIGN_PERCENTAGE + CONFIG.QUARTERLY_REVIEW_PERCENTAGE) {
            campaignType = 'quarterly';
        } else {
            campaignType = 'special';
        }
        
        const typeData = SAMPLE_DATA.campaignTypes.find(t => t.type === campaignType);
        const pattern = randomFromArray(typeData.patterns, rng);
        
        let campaignName = pattern;
        
        // Replace placeholders based on campaign type
        if (campaignType === 'leaver') {
            const targetEmployee = randomFromArray(employees, rng);
            campaignName = campaignName
                .replace('{employee_name}', targetEmployee.name)
                .replace('{emp_id}', targetEmployee.empId.toString());
        } else if (campaignType === 'quarterly') {
            const campaignDate = rng.randomDate(startDate, now);
            const year = campaignDate.getFullYear();
            const quarter = Math.ceil((campaignDate.getMonth() + 1) / 3);
            const timestamp = generateTimestamp(campaignDate, rng);
            const group = randomFromArray(SAMPLE_DATA.groups, rng);
            const department = randomFromArray(SAMPLE_DATA.departments, rng);
            
            campaignName = campaignName
                .replace('{year}', year.toString())
                .replace('{quarter}', quarter.toString())
                .replace('{timestamp}', timestamp)
                .replace('{group}', group)
                .replace('{department}', department);
        } else if (campaignType === 'special') {
            const year = Math.floor(rng.random() * 5) + 2020; // 2020-2024
            campaignName = campaignName.replace('{year}', year.toString());
        }
        
        const campaignStartDate = rng.randomDate(startDate, now);
        const campaignEndDate = rng.randomDate(
            new Date(campaignStartDate.getTime() + 30 * 24 * 60 * 60 * 1000), 
            new Date(campaignStartDate.getTime() + 90 * 24 * 60 * 60 * 1000)
        );
        const campaignCreatedDate = rng.randomDate(
            new Date(campaignStartDate.getTime() - 7 * 24 * 60 * 60 * 1000),
            campaignStartDate
        );
        const campaignLoadDate = rng.randomDate(campaignCreatedDate, campaignStartDate);
        
        const campaignId = generateCampaignId(rng);
        
        // Determine campaign status based on dates (date-aware logic)
        let campaignStatus;
        if (now < campaignStartDate) {
            // Campaign hasn't started yet -> STAGED
            campaignStatus = 'STAGED';
        } else if (now >= campaignStartDate && now <= campaignEndDate) {
            // Campaign is currently running -> ACTIVE
            campaignStatus = 'ACTIVE';
        } else {
            // Campaign has ended -> COMPLETED
            campaignStatus = 'COMPLETED';
        }
        
        // Add some randomness: 10% chance a completed campaign shows as ACTIVE (stale data scenario)
        // and 5% chance an active campaign shows as STAGED (not yet launched)
        const statusRand = rng.random();
        if (campaignStatus === 'COMPLETED' && statusRand < 0.10) {
            campaignStatus = 'ACTIVE'; // Stale campaign that should be closed
        } else if (campaignStatus === 'ACTIVE' && statusRand < 0.05) {
            campaignStatus = 'STAGED'; // Campaign prepared but not launched
        }
        
        campaigns.push({
            id: campaignId,
            name: campaignName,
            type: campaignType,
            startDate: campaignStartDate,
            endDate: campaignEndDate,
            createdDate: campaignCreatedDate,
            loadDate: campaignLoadDate,
            status: campaignStatus
        });
    }
    
    return campaigns;
}

function generateUARRecord(campaign, employees, rng) {
    const employee = randomFromArray(employees, rng);
    
    // Determine if this is an admin review
    const isAdminReview = rng.random() < CONFIG.ADMIN_REVIEWER_PERCENTAGE;
    
    // Determine if this is a reassignment
    const isReassignment = rng.random() < CONFIG.REASSIGNMENT_PERCENTAGE;
    
    // Determine if this is a manager review
    const isManagerReview = !isAdminReview && !isReassignment &&
                           rng.random() < CONFIG.MANAGER_REVIEW_PERCENTAGE;
    
    // Generate certification name
    let certificationName;
    if (isReassignment) {
        const originalReviewer = randomFromArray(SAMPLE_DATA.firstNames, rng) + ' ' + randomFromArray(SAMPLE_DATA.lastNames, rng);
        const newReviewer = isAdminReview ? SAMPLE_DATA.adminReviewer : 
                           randomFromArray(SAMPLE_DATA.commonReviewers, rng);
        certificationName = `Reassignment from '${campaign.type === 'leaver' ? 'Identity' : 'Manager'} Access Review for ${originalReviewer}' to ${newReviewer}`;
    } else if (isManagerReview) {
        certificationName = `Manager Access Review for ${employee.name}`;
    } else {
        certificationName = `Identity Access Review for ${employee.name}`;
    }
    
    // Generate reviewer
    let reviewerName, reviewerEmail;
    if (isAdminReview) {
        reviewerName = SAMPLE_DATA.adminReviewer;
        reviewerEmail = CONFIG.ADMIN_EMAIL;
    } else if (isReassignment) {
        reviewerName = randomFromArray(SAMPLE_DATA.commonReviewers, rng);
        reviewerEmail = generateEmail(reviewerName.split(' ')[0], reviewerName.split(' ')[1]);
    } else {
        reviewerName = employee.name;
        reviewerEmail = employee.email;
    }
    
    // Generate load date within recent timeframe (based on DATE_RANGE_DAYS config)
    const now = new Date();
    const startDate = new Date(now.getTime() - (CONFIG.DATE_RANGE_DAYS * 24 * 60 * 60 * 1000));
    const loadDate = rng.randomDate(startDate, now);
    
    // Generate status based on CONFIG.STATUS_DISTRIBUTION
    const statusRand = rng.random();
    let status;

    const closedThreshold = CONFIG.STATUS_DISTRIBUTION['CLOSED'];
    const newThreshold = closedThreshold + CONFIG.STATUS_DISTRIBUTION['NEW'];

    if (statusRand < closedThreshold) {
        status = 'CLOSED';
    } else if (statusRand < newThreshold) {
        status = 'NEW';
    } else {
        status = 'IN PROGRESS';
    }
    
    // Generate certification times
    const certStartDate = rng.randomDate(campaign.startDate, new Date(campaign.startDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    const certEndDate = status === 'CLOSED' ? 
        rng.randomDate(certStartDate, campaign.endDate) : 
        null;
    
    // Calculate SLA due date based on campaign type and configuration
    let slaDays;
    if (campaign.type === 'leaver') {
        slaDays = CONFIG.LEAVER_CAMPAIGN_SLA_DAYS;
    } else if (campaign.type === 'special') {
        slaDays = CONFIG.SPECIAL_ACCESS_SLA_DAYS;
    } else if (campaign.type === 'quarterly') {
        slaDays = CONFIG.QUARTERLY_REVIEW_SLA_DAYS;
    } else {
        slaDays = CONFIG.CERT_SLA_DAYS_TYPICAL;
    }
    
    // Add some randomness (+/- 3 days) to make it realistic
    const slaVariance = rng.randomInt(-3, 3);
    slaDays = Math.max(CONFIG.CERT_SLA_DAYS_MIN, Math.min(CONFIG.CERT_SLA_DAYS_MAX, slaDays + slaVariance));
    
    const certDueDate = new Date(certStartDate.getTime() + (slaDays * 24 * 60 * 60 * 1000));
    const certLoadDate = rng.randomDate(campaign.loadDate, campaign.startDate);
    
    // Generate source
    const source = randomFromArray(SAMPLE_DATA.sources, rng);
    
    // Generate termination tracking data (for Gartner ODM)
    const terminationData = generateTerminationTimestamps(certLoadDate, campaign.type, rng);
    
    // Generate certification ID
    const certificationId = generateCertificationId(rng);
    
    // Calculate derived fields
    const certificationCompleted = status === 'CLOSED';
    const tlDate = getTLDate(certStartDate);
    
    // Calculate Phase by SLA
    let phaseBySLA;
    if (status === 'CLOSED') {
        const completedOnTime = certEndDate <= certDueDate;
        phaseBySLA = completedOnTime ? 'Completed within SLA' : 'Completed past SLA';
    } else {
        const isOpenOnTime = new Date() <= certDueDate;
        phaseBySLA = isOpenOnTime ? 'Open within SLA' : 'Open Past SLA';
    }
    
    // Compliance status
    const complianceStatus = phaseBySLA === 'Open Past SLA' ? 'Not Compliant' : 'Compliant';
    
    // Generate UNIQUE_ID
    const uniqueId = generateUniqueId(
        campaign.name,
        certificationName,
        certificationId,
        campaign.id,
        employee.empId,
        employee.name,
        employee.email
    );
    
    // Count certifications (would need to aggregate in real scenario, using placeholder logic)
    const totalCertifications = rng.randomInt(50, 200);
    const completedCertifications = Math.floor(totalCertifications * CONFIG.COMPLIANCE_RATE);
    
    return {
        UNIQUE_ID: uniqueId,
        CAMPAIGN_ID: campaign.id,
        CAMPAIGN_NAME: campaign.name,
        CAMPAIGN_CREATED_DATETIME: formatDateTime(campaign.createdDate),
        CAMPAIGN_END_DATETIME: formatDateTime(campaign.endDate),
        CAMPAIGN_STATUS: campaign.status,
        CAMPAIGN_load_date: formatDate(campaign.loadDate),
        IS_ACTIVE_CAMPAIGN: campaign.status === 'ACTIVE',
        UAR_SOURCE: source,
        CERTIFICATION_ID: certificationId,
        CERTIFICATION_NAME: certificationName,
        CERTIFICATION_START_DATETIME: formatDateTime(certStartDate),
        CERTIFICATION_END_DATETIME: certEndDate ? formatDateTime(certEndDate) : '',
        CERTIFICATION_DUE_DATETIME: formatDateTime(certDueDate),
        CERTIFICATION_LOAD_DATE: formatDateTime(certLoadDate),
        TOTAL_CERTIFICATIONS: totalCertifications.toString(),
        COMPLETED_CERTIFICATIONS: completedCertifications.toString(),
        CERTIFICATION_COMPLETED: certificationCompleted,
        PHASE_BY_SLA: phaseBySLA,
        REVIEWER_NAME: reviewerName,
        REVIEWER_MAIL_ID: reviewerEmail,
        CERTIFICATION_STATUS: status,
        COMPLIANCE_STATUS: complianceStatus,
        IS_CURRENT: true,
        TL_DATE: tlDate,
        EMPLOYEE_ID: employee.empId.toString(),
        EMPLOYEE_NAME: employee.name,
        EMPLOYEE_EMAIL_ADDRESS: employee.email,
        EMPLOYEE_JOB_TITLE: employee.jobTitle,
        MANAGER_FULL_NAME: employee.managerName,
        LEVEL_1: employee.level1,
        LEVEL_2: employee.level2,
        LEVEL_3: employee.level3,
        LEVEL_4: employee.level4,
        LEVEL_5: employee.level5,
        LEVEL_6: employee.level6,
        Manager_email_id: employee.managerEmail,
        Manager_employee_id: employee.managerEmpId.toString(),
        // Gartner ODM - Termination tracking fields (V3.0: Minutes!)
        TERMINATION_REQUEST_DATETIME: terminationData.terminationRequestTime,
        DEPROVISION_COMPLETE_DATETIME: terminationData.deprovisionCompleteTime,
        MINUTES_TO_DEPROVISION: terminationData.minutesToDeprovision,
        DEPROVISION_COMPLIANCE: terminationData.deprovisionCompliance
    };
}

// ========== V3 RECORD TRANSFORMATION ==========
/**
 * Transform V2 internal record format to V3 output format
 * - Converts dates to US format (M/D/YYYY h:mm:ss AM/PM)
 * - Converts booleans to TRUE/FALSE
 * - Adds new columns: Past Due, User Access Grouping, Data as of, Due in Days
 * - Renames columns to Title Case
 * - Removes unnecessary columns (TOTAL_CERTIFICATIONS, IS_SENSITIVE_SYSTEM)
 * - Reorders to match source data format
 */
function transformRecordToV3(v2Record) {
    const now = new Date();
    const dueDate = new Date(v2Record.CERTIFICATION_DUE_DATETIME);
    const dueInDays = daysBetween(now, dueDate);

    // Determine if past due (only for non-closed certifications)
    const isPastDue = (dueInDays < 0 && v2Record.CERTIFICATION_STATUS !== 'CLOSED');

    // Recalculate Phase By SLA and Compliance Status based on current date (not generation date)
    let phaseBySLA;
    let complianceStatus;
    
    if (v2Record.CERTIFICATION_STATUS === 'CLOSED') {
        // For closed certifications, check if completed on time
        const certEndDate = v2Record.CERTIFICATION_END_DATETIME ? new Date(v2Record.CERTIFICATION_END_DATETIME) : null;
        if (certEndDate) {
            const completedOnTime = certEndDate <= dueDate;
            phaseBySLA = completedOnTime ? 'Completed within SLA' : 'Completed past SLA';
        } else {
            phaseBySLA = 'Completed within SLA'; // No end date, assume on time
        }
        complianceStatus = 'Compliant'; // Closed records are always compliant
    } else {
        // For open certifications, check if past due date
        const isOpenOnTime = now <= dueDate;
        phaseBySLA = isOpenOnTime ? 'Open within SLA' : 'Open Past SLA';
        complianceStatus = isOpenOnTime ? 'Compliant' : 'Not Compliant';
    }

    // Create V3 record with correct column names and order
    const v3Record = {};

    // Map fields in V3 column order
    v3Record['Campaign Created Datetime'] = v2Record.CAMPAIGN_CREATED_DATETIME;
    v3Record['Campaign End Datetime'] = v2Record.CAMPAIGN_END_DATETIME;
    v3Record['Campaign Id'] = v2Record.CAMPAIGN_ID;
    v3Record['Campaign Load Date'] = v2Record.CAMPAIGN_load_date;
    v3Record['Campaign Name'] = v2Record.CAMPAIGN_NAME;
    v3Record['Campaign Status'] = v2Record.CAMPAIGN_STATUS;
    v3Record['Certification Completed'] = formatBoolean(v2Record.CERTIFICATION_COMPLETED);
    v3Record['Certification Due Date'] = v2Record.CERTIFICATION_DUE_DATETIME;
    v3Record['Certification End Date'] = v2Record.CERTIFICATION_END_DATETIME;
    v3Record['Certification Id'] = v2Record.CERTIFICATION_ID;
    v3Record['Certification Load Date'] = v2Record.CERTIFICATION_LOAD_DATE;
    v3Record['Certification Name'] = v2Record.CERTIFICATION_NAME;
    v3Record['Certification Start Date'] = v2Record.CERTIFICATION_START_DATETIME;
    v3Record['Certification Status'] = v2Record.CERTIFICATION_STATUS;
    v3Record['Compliance Status'] = formatBoolean(complianceStatus === 'Compliant');
    v3Record['Employee Email Address'] = v2Record.EMPLOYEE_EMAIL_ADDRESS;
    v3Record['Employee Id'] = v2Record.EMPLOYEE_ID;
    v3Record['Employee Job Title'] = v2Record.EMPLOYEE_JOB_TITLE;
    v3Record['Employee Name'] = v2Record.EMPLOYEE_NAME;
    v3Record['Level 3'] = v2Record.LEVEL_3;
    v3Record['Is Active Campaign'] = formatBoolean(v2Record.IS_ACTIVE_CAMPAIGN);
    v3Record['Is Current'] = formatBoolean(v2Record.IS_CURRENT);
    v3Record['Level 1'] = v2Record.LEVEL_1;
    v3Record['Level 5'] = v2Record.LEVEL_5;
    v3Record['Level 6'] = v2Record.LEVEL_6;
    v3Record['Manager Email Address'] = v2Record.Manager_email_id;
    v3Record['Manager Employee Id'] = v2Record.Manager_employee_id;
    v3Record['Manager Full Name'] = v2Record.MANAGER_FULL_NAME;
    v3Record['Past Due'] = isPastDue ? 'Past Due' : '';
    v3Record['Phase By Sla'] = phaseBySLA;
    v3Record['Reviewer Mail Id'] = v2Record.REVIEWER_MAIL_ID;
    v3Record['Reviewer Name'] = v2Record.REVIEWER_NAME;
    v3Record['Level 4'] = v2Record.LEVEL_4;
    v3Record['Tl Date'] = v2Record.TL_DATE;
    v3Record['Uar Source'] = v2Record.UAR_SOURCE;
    v3Record['Unique Key'] = v2Record.UNIQUE_ID;
    v3Record['User Access Grouping'] = getUserAccessGrouping(dueInDays);
    v3Record['Level 2'] = v2Record.LEVEL_2;
    v3Record['Completed Certifications'] = v2Record.COMPLETED_CERTIFICATIONS;
    v3Record['Total Certifications'] = v2Record.TOTAL_CERTIFICATIONS;
    v3Record['Data as of'] = v2Record.CAMPAIGN_load_date; // Same as Campaign Load Date
    v3Record['Due in Days'] = dueInDays.toString();
    v3Record['Termination Request Datetime'] = v2Record.TERMINATION_REQUEST_DATETIME;
    v3Record['Deprovision Complete Datetime'] = v2Record.DEPROVISION_COMPLETE_DATETIME;
    v3Record['Minutes To Deprovision'] = v2Record.MINUTES_TO_DEPROVISION;
    v3Record['Deprovision Compliance Status'] = v2Record.DEPROVISION_COMPLIANCE !== null ? formatBoolean(v2Record.DEPROVISION_COMPLIANCE) : '';

    return v3Record;
}


// Set IS_CURRENT flag: only the latest record per employee+campaign should be current
function setIsCurrentFlags(records, logger) {
    logger('🔄 Setting IS_CURRENT flags for latest records per employee+campaign...');
    
    // First, set all to false
    records.forEach(r => r.IS_CURRENT = false);
    
    // Group records by employee+campaign
    const grouped = {};
    records.forEach(record => {
        const key = `${record.EMPLOYEE_ID}_${record.CAMPAIGN_ID}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(record);
    });
    
    // For each group, find the latest record and mark it as current
    let currentCount = 0;
    Object.values(grouped).forEach(group => {
        // Sort by certification start date (most recent first)
        group.sort((a, b) => {
            const dateA = new Date(a.CERTIFICATION_START_DATETIME);
            const dateB = new Date(b.CERTIFICATION_START_DATETIME);
            return dateB - dateA;
        });
        
        // Mark the most recent as current (only if campaign is still active)
        const latest = group[0];
        if (latest.IS_ACTIVE_CAMPAIGN) {
            latest.IS_CURRENT = true;
            currentCount++;
        }
    });
    
    const historicalCount = records.length - currentCount;
    logger('   ✅ Marked ' + currentCount.toLocaleString() + ' records as IS_CURRENT=TRUE (latest per employee+campaign)');
    logger('   ✅ Marked ' + historicalCount.toLocaleString() + ' records as IS_CURRENT=FALSE (historical)');
}

function generateUARData(logger = console.log) {
    // Initialize seeded random number generator
    let rng;
    if (CONFIG.RANDOM_SEED !== null) {
        rng = new SeededRandom(CONFIG.RANDOM_SEED);
        logger(`🎲 Using seed ${CONFIG.RANDOM_SEED} for reproducible data generation`);
    } else {
        rng = {
            random: () => Math.random(),
            randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
            randomFromArray: (arr) => arr[Math.floor(Math.random() * arr.length)],
            randomDate: (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
        };
    }
    
    logger('🔐 Generating UAR (User Access Review) Data...');
    logger(`📊 Config: ${CONFIG.RECORD_COUNT} records, ${CONFIG.EMPLOYEE_COUNT} employees, ${CONFIG.CAMPAIGN_COUNT} campaigns`);
    logger(`🎯 Target compliance rate: ${(CONFIG.COMPLIANCE_RATE * 100).toFixed(1)}%`);
    
    logger('👥 Creating employee pool...');
    const employees = createEmployeePool(CONFIG.EMPLOYEE_COUNT, rng);
    
    logger('📋 Generating access review campaigns...');
    const campaigns = createCampaigns(CONFIG.CAMPAIGN_COUNT, employees, rng);
    
    logger('🔍 Generating UAR records...');
    const records = [];

    // Separate campaigns by type for proper distribution
    const leaverCampaigns = campaigns.filter(c => c.type === 'leaver');
    const quarterlyCampaigns = campaigns.filter(c => c.type === 'quarterly');
    const specialCampaigns = campaigns.filter(c => c.type === 'special');

    logger(`   Campaigns created: ${leaverCampaigns.length} leaver, ${quarterlyCampaigns.length} quarterly, ${specialCampaigns.length} special`);

    // Calculate how many records should be in each campaign type
    const leaverRecordCount = Math.round(CONFIG.RECORD_COUNT * CONFIG.LEAVER_CAMPAIGN_PERCENTAGE);
    const quarterlyRecordCount = Math.round(CONFIG.RECORD_COUNT * CONFIG.QUARTERLY_REVIEW_PERCENTAGE);
    const specialRecordCount = Math.round(CONFIG.RECORD_COUNT * CONFIG.SPECIAL_ACCESS_PERCENTAGE);

    logger(`   Target record distribution: ${leaverRecordCount} leaver, ${quarterlyRecordCount} quarterly, ${specialRecordCount} special`);

    // Generate records with proper distribution
    for (let i = 0; i < leaverRecordCount; i++) {
        const campaign = randomFromArray(leaverCampaigns, rng);
        const record = generateUARRecord(campaign, employees, rng);
        records.push(record);
    }

    for (let i = 0; i < quarterlyRecordCount; i++) {
        const campaign = randomFromArray(quarterlyCampaigns, rng);
        const record = generateUARRecord(campaign, employees, rng);
        records.push(record);
    }

    for (let i = 0; i < specialRecordCount; i++) {
        const campaign = randomFromArray(specialCampaigns, rng);
        const record = generateUARRecord(campaign, employees, rng);
        records.push(record);
    }

    // Shuffle records to mix campaign types
    for (let i = records.length - 1; i > 0; i--) {
        const j = Math.floor(rng.random() * (i + 1));
        [records[i], records[j]] = [records[j], records[i]];
    }
    
    // POST-GENERATION COMPLIANCE ADJUSTMENT
    logger('🎯 Adjusting records to achieve target compliance rate...');
    adjustComplianceToTarget(records, CONFIG.COMPLIANCE_RATE, rng, logger);

    // Adjust ODM deprovision compliance if enabled
    if (CONFIG.TERMINATION_TRACKING_ENABLED) {
        logger('🎯 Adjusting ODM deprovision compliance to target rate...');
        adjustDeprovisionComplianceToTarget(records, CONFIG.DEPROVISION_COMPLIANCE_RATE, rng, logger);
    }

    // Set IS_CURRENT flags
    setIsCurrentFlags(records, logger);

    return { records, employees, campaigns };
}

// Post-generation compliance adjustment function
function adjustComplianceToTarget(records, targetRate, rng, logger) {
    // Calculate current compliance
    const currentCompliant = records.filter(r => r.COMPLIANCE_STATUS === 'Compliant').length;
    const currentRate = currentCompliant / records.length;
    
    const targetCompliant = Math.round(records.length * targetRate);
    const adjustment = targetCompliant - currentCompliant;
    
    logger(`   Current compliance: ${currentCompliant.toLocaleString()}/${records.length.toLocaleString()} (${(currentRate * 100).toFixed(2)}%)`);
    logger(`   Target compliance: ${targetCompliant.toLocaleString()}/${records.length.toLocaleString()} (${(targetRate * 100).toFixed(2)}%)`);
    logger(`   Adjustment needed: ${adjustment > 0 ? '+' : ''}${adjustment} records`);
    
    if (adjustment === 0) {
        logger('   ✅ Already at target compliance rate!');
        return;
    }
    
    if (adjustment > 0) {
        // Need to make more records compliant
        // Find non-compliant records and make them compliant
        const nonCompliantRecords = records.filter(r => r.COMPLIANCE_STATUS === 'Not Compliant');
        
        if (nonCompliantRecords.length === 0) {
            logger('   ⚠️  No non-compliant records to adjust');
            return;
        }
        
        // Randomly select records to flip to compliant
        const toAdjust = Math.min(adjustment, nonCompliantRecords.length);
        const shuffled = [...nonCompliantRecords].sort(() => rng.random() - 0.5);
        
        for (let i = 0; i < toAdjust; i++) {
            const record = shuffled[i];
            record.COMPLIANCE_STATUS = 'Compliant';
            
            // Adjust the PHASE_BY_SLA to match
            if (record.CERTIFICATION_STATUS === 'CLOSED') {
                record.PHASE_BY_SLA = 'Completed within SLA';
            } else {
                record.PHASE_BY_SLA = 'Open within SLA';
            }
        }
        
        logger(`   ✅ Adjusted ${toAdjust} records from Non-Compliant to Compliant`);
        
    } else {
        // Need to make some records non-compliant
        const compliantRecords = records.filter(r => r.COMPLIANCE_STATUS === 'Compliant');
        
        if (compliantRecords.length === 0) {
            logger('   ⚠️  No compliant records to adjust');
            return;
        }
        
        // Randomly select records to flip to non-compliant
        const toAdjust = Math.min(Math.abs(adjustment), compliantRecords.length);
        const shuffled = [...compliantRecords].sort(() => rng.random() - 0.5);
        
        for (let i = 0; i < toAdjust; i++) {
            const record = shuffled[i];
            record.COMPLIANCE_STATUS = 'Not Compliant';
            
            // Only open records can be "Open Past SLA" (non-compliant)
            // Closed records that are non-compliant should stay as "Completed past SLA"
            if (record.CERTIFICATION_STATUS !== 'CLOSED') {
                record.PHASE_BY_SLA = 'Open Past SLA';
            } else {
                // Keep as completed past SLA (still technically compliant in the data model)
                // So we need to pick different records - skip closed ones
                continue;
            }
        }
        
        logger(`   ✅ Adjusted ${toAdjust} records from Compliant to Non-Compliant`);
    }
    
    // Verify final compliance
    const finalCompliant = records.filter(r => r.COMPLIANCE_STATUS === 'Compliant').length;
    const finalRate = finalCompliant / records.length;
    logger(`   🎯 Final compliance: ${finalCompliant.toLocaleString()}/${records.length.toLocaleString()} (${(finalRate * 100).toFixed(2)}%)`);
}

// Post-generation ODM deprovision compliance adjustment function
function adjustDeprovisionComplianceToTarget(records, targetRate, rng, logger) {
    // Filter only records with termination data
    const terminationRecords = records.filter(r => r.DEPROVISION_COMPLIANCE !== null);

    if (terminationRecords.length === 0) {
        logger('   ⚠️  No termination records to adjust');
        return;
    }

    // Calculate current deprovision compliance
    const currentCompliant = terminationRecords.filter(r => r.DEPROVISION_COMPLIANCE === true).length;
    const currentRate = currentCompliant / terminationRecords.length;

    const targetCompliant = Math.round(terminationRecords.length * targetRate);
    const adjustment = targetCompliant - currentCompliant;

    logger(`   Current deprovision compliance: ${currentCompliant.toLocaleString()}/${terminationRecords.length.toLocaleString()} (${(currentRate * 100).toFixed(2)}%)`);
    logger(`   Target deprovision compliance: ${targetCompliant.toLocaleString()}/${terminationRecords.length.toLocaleString()} (${(targetRate * 100).toFixed(2)}%)`);
    logger(`   Adjustment needed: ${adjustment > 0 ? '+' : ''}${adjustment} records`);

    if (adjustment === 0) {
        logger('   ✅ Already at target deprovision compliance rate!');
        return;
    }

    if (adjustment > 0) {
        // Need to make more records compliant (reduce minutes to be within SLA)
        const nonCompliantRecords = terminationRecords.filter(r => r.DEPROVISION_COMPLIANCE === false);

        if (nonCompliantRecords.length === 0) {
            logger('   ⚠️  No non-compliant deprovision records to adjust');
            return;
        }

        const toAdjust = Math.min(adjustment, nonCompliantRecords.length);
        const shuffled = [...nonCompliantRecords].sort(() => rng.random() - 0.5);

        for (let i = 0; i < toAdjust; i++) {
            const record = shuffled[i];
            // Reduce to be within SLA (random between 30 minutes and SLA)
            const newMinutes = rng.randomInt(CONFIG.MIN_DEPROVISION_MINUTES, CONFIG.DEPROVISION_SLA_MINUTES);
            record.MINUTES_TO_DEPROVISION = newMinutes.toString();
            record.DEPROVISION_COMPLIANCE = true;

            // Recalculate deprovision complete time
            const termDate = new Date(record.TERMINATION_REQUEST_DATETIME);
            const newDeprovisionDate = new Date(termDate.getTime() + (newMinutes * 60 * 1000));
            record.DEPROVISION_COMPLETE_DATETIME = formatDateTime(newDeprovisionDate);
        }

        logger(`   ✅ Adjusted ${toAdjust} records to meet deprovision SLA`);

    } else {
        // Need to make some records non-compliant (increase minutes to exceed SLA)
        const compliantRecords = terminationRecords.filter(r => r.DEPROVISION_COMPLIANCE === true);

        if (compliantRecords.length === 0) {
            logger('   ⚠️  No compliant deprovision records to adjust');
            return;
        }

        const toAdjust = Math.abs(adjustment);
        const shuffled = [...compliantRecords].sort(() => rng.random() - 0.5);

        for (let i = 0; i < toAdjust; i++) {
            const record = shuffled[i];
            // Increase to exceed SLA (random between SLA+1 and MAX)
            const newMinutes = rng.randomInt(CONFIG.DEPROVISION_SLA_MINUTES + 1, CONFIG.MAX_DEPROVISION_MINUTES);
            record.MINUTES_TO_DEPROVISION = newMinutes.toString();
            record.DEPROVISION_COMPLIANCE = false;

            // Recalculate deprovision complete time
            const termDate = new Date(record.TERMINATION_REQUEST_DATETIME);
            const newDeprovisionDate = new Date(termDate.getTime() + (newMinutes * 60 * 1000));
            record.DEPROVISION_COMPLETE_DATETIME = formatDateTime(newDeprovisionDate);
        }

        logger(`   ✅ Adjusted ${toAdjust} records to exceed deprovision SLA`);
    }

    // Verify final compliance
    const finalCompliant = terminationRecords.filter(r => r.DEPROVISION_COMPLIANCE === true).length;
    const finalRate = finalCompliant / terminationRecords.length;
    logger(`   🎯 Final deprovision compliance: ${finalCompliant.toLocaleString()}/${terminationRecords.length.toLocaleString()} (${(finalRate * 100).toFixed(2)}%)`);
}

// Output formatters
function formatAsTSV(records) {
    if (records.length === 0) return '';
    
    const headers = Object.keys(records[0]);
    let tsv = headers.join('\t') + '\n';
    
    records.forEach(record => {
        const values = headers.map(header => {
            const value = record[header];
            return String(value);
        });
        tsv += values.join('\t') + '\n';
    });
    
    return tsv;
}

function formatAsCSV(records) {
    if (records.length === 0) return '';

    // Transform all records to V3 format
    const v3Records = records.map(r => transformRecordToV3(r));

    // Use V3 column names for header
    let csv = V3_COLUMN_NAMES.join(',') + '\n';

    v3Records.forEach(record => {
        const values = V3_COLUMN_NAMES.map(header => {
            const value = record[header];
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        csv += values.join(',') + '\n';
    });

    return csv;
}

function formatAsJSON(records) {
    return JSON.stringify(records, null, 2);
}

// Function to generate statistics as a string (for file output)
function generateStatsString(data) {
    const { records, employees, campaigns } = data;
    
    let statsOutput = '';
    statsOutput += '='.repeat(70) + '\n';
    statsOutput += 'UAR (USER ACCESS REVIEW) DATA GENERATOR STATISTICS\n';
    statsOutput += '='.repeat(70) + '\n';
    statsOutput += `Total Records Generated: ${records.length.toLocaleString()}\n`;
    statsOutput += `Total Employees: ${employees.length.toLocaleString()}\n`;
    statsOutput += `Total Campaigns: ${campaigns.length}\n`;
    
    // Campaign type analysis
    const campaignTypes = {};
    campaigns.forEach(campaign => {
        campaignTypes[campaign.type] = (campaignTypes[campaign.type] || 0) + 1;
    });
    
    statsOutput += '\nCAMPAIGN TYPE DISTRIBUTION:\n';
    Object.entries(campaignTypes).forEach(([type, count]) => {
        const percentage = ((count / campaigns.length) * 100).toFixed(1);
        const displayType = type === 'leaver' ? 'Leaver Campaigns' : 
                           type === 'quarterly' ? 'Quarterly Reviews' : 'Special Access Reviews';
        statsOutput += `  ${displayType}: ${count} campaigns (${percentage}%)\n`;
    });
    
    // Status distribution analysis
    const statusCounts = {};
    records.forEach(record => {
        statusCounts[record.CERTIFICATION_STATUS] = (statusCounts[record.CERTIFICATION_STATUS] || 0) + 1;
    });
    
    statsOutput += '\nCERTIFICATION STATUS DISTRIBUTION:\n';
    Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = ((count / records.length) * 100).toFixed(1);
        statsOutput += `  ${status}: ${count.toLocaleString()} records (${percentage}%)\n`;
    });
    
    // Reviewer analysis
    const reviewerCounts = {};
    const adminReviewCount = records.filter(r => r.REVIEWER_NAME === SAMPLE_DATA.adminReviewer).length;
    const reassignmentCount = records.filter(r => r.CERTIFICATION_NAME.includes('Reassignment')).length;
    const managerReviewCount = records.filter(r => r.CERTIFICATION_NAME.includes('Manager Access Review')).length;
    
    statsOutput += '\nREVIEWER TYPE ANALYSIS:\n';
    statsOutput += `  Admin Reviews (${SAMPLE_DATA.adminReviewer}): ${adminReviewCount.toLocaleString()} records (${((adminReviewCount / records.length) * 100).toFixed(1)}%)\n`;
    statsOutput += `  Reassignments: ${reassignmentCount.toLocaleString()} records (${((reassignmentCount / records.length) * 100).toFixed(1)}%)\n`;
    statsOutput += `  Manager Reviews: ${managerReviewCount.toLocaleString()} records (${((managerReviewCount / records.length) * 100).toFixed(1)}%)\n`;
    
    // Top reviewers
    records.forEach(record => {
        if (record.REVIEWER_NAME !== SAMPLE_DATA.adminReviewer) {
            reviewerCounts[record.REVIEWER_NAME] = (reviewerCounts[record.REVIEWER_NAME] || 0) + 1;
        }
    });
    
    const topReviewers = Object.entries(reviewerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    statsOutput += '\nTOP 10 REVIEWERS (excluding admin):\n';
    topReviewers.forEach(([name, count]) => {
        const percentage = ((count / records.length) * 100).toFixed(1);
        statsOutput += `  ${name}: ${count} reviews (${percentage}%)\n`;
    });
    
    // Source system analysis
    const sourceCounts = {};
    records.forEach(record => {
        sourceCounts[record.UAR_SOURCE] = (sourceCounts[record.UAR_SOURCE] || 0) + 1;
    });
    
    statsOutput += '\nSOURCE SYSTEM DISTRIBUTION:\n';
    Object.entries(sourceCounts).forEach(([source, count]) => {
        const percentage = ((count / records.length) * 100).toFixed(1);
        statsOutput += `  ${source}: ${count.toLocaleString()} records (${percentage}%)\n`;
    });
    
    // Load date analysis
    const loadDates = records.map(r => new Date(r.CERTIFICATION_LOAD_DATE));
    const minDate = new Date(Math.min(...loadDates));
    const maxDate = new Date(Math.max(...loadDates));
    
    statsOutput += '\nDATE RANGE ANALYSIS:\n';
    statsOutput += `  Load Date Range: ${formatDate(minDate)} to ${formatDate(maxDate)}\n`;
    statsOutput += `  Data Span: ${Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24))} days\n`;
    
    // Trendline Analysis - Monthly breakdown
    if (CONFIG.ENABLE_TRENDLINE) {
        const monthlyStats = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        records.forEach(record => {
            const date = new Date(record.CERTIFICATION_LOAD_DATE);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = {
                    name: monthName,
                    total: 0,
                    closed: 0,
                    terminations: 0,
                    deprovisionHours: []
                };
            }
            
            monthlyStats[monthKey].total++;
            if (record.CERTIFICATION_STATUS === 'CLOSED') {
                monthlyStats[monthKey].closed++;
            }
            if (record.MINUTES_TO_DEPROVISION && record.MINUTES_TO_DEPROVISION !== '') {
                monthlyStats[monthKey].terminations++;
                monthlyStats[monthKey].deprovisionHours.push(parseInt(record.MINUTES_TO_DEPROVISION) / 60); // Convert to hours for display
            }
        });
        
        statsOutput += '\nMONTHLY TRENDLINE ANALYSIS:\n';
        statsOutput += '  Month         Records  Compliance%  Terminations  Avg Deprovision\n';
        statsOutput += '  ' + '-'.repeat(64) + '\n';
        
        Object.keys(monthlyStats).sort().forEach(monthKey => {
            const stat = monthlyStats[monthKey];
            const complianceRate = ((stat.closed / stat.total) * 100).toFixed(1);
            const avgDeprovision = stat.deprovisionHours.length > 0 ?
                (stat.deprovisionHours.reduce((a, b) => a + b, 0) / stat.deprovisionHours.length).toFixed(1) : 'N/A';
            
            statsOutput += `  ${stat.name.padEnd(13)} ${String(stat.total).padStart(7)}  ${String(complianceRate).padStart(11)}%  ${String(stat.terminations).padStart(12)}  ${String(avgDeprovision).padStart(12)}h\n`;
        });
        
        statsOutput += '\nTRENDLINE INSIGHTS:\n';
        
        // Check if custom weights are being used
        const usingCustomCompliance = CONFIG.MONTHLY_COMPLIANCE_WEIGHTS && 
                                      Array.isArray(CONFIG.MONTHLY_COMPLIANCE_WEIGHTS) && 
                                      CONFIG.MONTHLY_COMPLIANCE_WEIGHTS.length === 12;
        const usingCustomDeprovision = CONFIG.MONTHLY_DEPROVISION_WEIGHTS && 
                                       Array.isArray(CONFIG.MONTHLY_DEPROVISION_WEIGHTS) && 
                                       CONFIG.MONTHLY_DEPROVISION_WEIGHTS.length === 12;
        
        if (usingCustomCompliance) {
            statsOutput += `  - Using CUSTOM monthly compliance weights\n`;
            statsOutput += `  - Weights: [${CONFIG.MONTHLY_COMPLIANCE_WEIGHTS.map(w => w.toFixed(2)).join(', ')}]\n`;
        } else {
            statsOutput += `  - Using AUTOMATIC compliance pattern (sinusoidal)\n`;
            statsOutput += `  - Peak Compliance Month: ${monthNames[CONFIG.PEAK_COMPLIANCE_MONTH]} (post-audit season)\n`;
            statsOutput += `  - Low Compliance Month: ${monthNames[CONFIG.LOW_COMPLIANCE_MONTH]} (holiday season)\n`;
            statsOutput += `  - Compliance Variance: ±${(CONFIG.COMPLIANCE_VARIANCE * 100).toFixed(0)}% over the year\n`;
        }
        
        if (usingCustomDeprovision) {
            statsOutput += `  - Using CUSTOM monthly deprovisioning weights\n`;
            statsOutput += `  - Weights: [${CONFIG.MONTHLY_DEPROVISION_WEIGHTS.map(w => w.toFixed(2)).join(', ')}]\n`;
        } else {
            statsOutput += `  - Using AUTOMATIC deprovisioning pattern (seasonal)\n`;
            statsOutput += `  - Seasonal impact on deprovisioning: ${(CONFIG.DEPROVISION_SEASONAL_IMPACT * 100).toFixed(0)}% variance\n`;
        }
    }
    
    // Gartner ODM - Access Termination Metrics
    if (CONFIG.TERMINATION_TRACKING_ENABLED) {
        const terminationRecords = records.filter(r => r.MINUTES_TO_DEPROVISION && r.MINUTES_TO_DEPROVISION !== '');

        if (terminationRecords.length > 0) {
            const deprovisionMinutes = terminationRecords.map(r => parseInt(r.MINUTES_TO_DEPROVISION));
            const avgDeprovisionMinutes = (deprovisionMinutes.reduce((a, b) => a + b, 0) / deprovisionMinutes.length).toFixed(2);
            const avgDeprovisionHours = (avgDeprovisionMinutes / 60).toFixed(2);

            const fastDeprovision = terminationRecords.filter(r => parseInt(r.MINUTES_TO_DEPROVISION) <= 240).length; // ≤ 4 hours
            const slowDeprovision = terminationRecords.filter(r => parseInt(r.MINUTES_TO_DEPROVISION) >= 1440).length; // ≥ 24 hours
            
            statsOutput += '\n' + '='.repeat(70) + '\n';
            statsOutput += 'GARTNER ODM - ACCESS TERMINATION METRICS (V3.0: MINUTES)\n';
            statsOutput += '='.repeat(70) + '\n';
            statsOutput += `Total Termination Events: ${terminationRecords.length.toLocaleString()}\n`;
            statsOutput += '\nDEPROVISIONING TIME ANALYSIS:\n';
            statsOutput += `  Average Minutes to Deprovision: ${avgDeprovisionMinutes} minutes (${avgDeprovisionHours} hours)\n`;
            statsOutput += `  Fast Deprovisioning (≤4 hours): ${fastDeprovision} (${((fastDeprovision / terminationRecords.length) * 100).toFixed(1)}%)\n`;
            statsOutput += `  Slow Deprovisioning (≥24 hours): ${slowDeprovision} (${((slowDeprovision / terminationRecords.length) * 100).toFixed(1)}%)\n`;
            statsOutput += '\nGARTNER ODM CALCULATION:\n';
            statsOutput += `  Metric: Average minutes from termination request to deprovisioning\n`;
            statsOutput += `  Result: ${avgDeprovisionMinutes} minutes (${avgDeprovisionHours} hours)\n`;
            statsOutput += `  Scope: Past 12 months of termination events\n`;
        }
    }
    
    statsOutput += '\nKEY INSIGHTS:\n';
    statsOutput += '  - Realistic UAR certification workflow patterns\n';
    statsOutput += '  - Mix of leaver campaigns, quarterly reviews, and special access reviews\n';
    statsOutput += '  - Admin reviewer handling security-sensitive reviews\n';
    statsOutput += '  - Reassignment workflow for reviewer changes\n';
    statsOutput += '  - Manager access reviews for elevated privileges\n';
    statsOutput += '  - Configurable compliance and reviewer distribution rates\n';
    if (CONFIG.TERMINATION_TRACKING_ENABLED) {
        statsOutput += '  - Gartner ODM access termination metrics included\n';
        statsOutput += '  - Deprovisioning time tracking for compliance reporting\n';
    }
    
    return statsOutput;
}

function displayStats(data) {
    const { records, employees, campaigns } = data;
    
    console.log('\n' + '='.repeat(70));
    console.log('UAR (USER ACCESS REVIEW) DATA GENERATOR STATISTICS');
    console.log('='.repeat(70));
    console.log(`Total Records Generated: ${records.length.toLocaleString()}`);
    console.log(`Total Employees: ${employees.length.toLocaleString()}`);
    console.log(`Total Campaigns: ${campaigns.length}`);
    
    // Campaign type analysis
    const campaignTypes = {};
    campaigns.forEach(campaign => {
        campaignTypes[campaign.type] = (campaignTypes[campaign.type] || 0) + 1;
    });
    
    console.log('\nCAMPAIGN TYPE DISTRIBUTION:');
    Object.entries(campaignTypes).forEach(([type, count]) => {
        const percentage = ((count / campaigns.length) * 100).toFixed(1);
        const displayType = type === 'leaver' ? 'Leaver Campaigns' : 
                           type === 'quarterly' ? 'Quarterly Reviews' : 'Special Access Reviews';
        console.log(`  ${displayType}: ${count} campaigns (${percentage}%)`);
    });
    
    // Status distribution analysis
    const statusCounts = {};
    records.forEach(record => {
        statusCounts[record.CERTIFICATION_STATUS] = (statusCounts[record.CERTIFICATION_STATUS] || 0) + 1;
    });
    
    console.log('\nCERTIFICATION STATUS DISTRIBUTION:');
    Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = ((count / records.length) * 100).toFixed(1);
        console.log(`  ${status}: ${count.toLocaleString()} records (${percentage}%)`);
    });
    
    // Reviewer analysis
    const reviewerCounts = {};
    const adminReviewCount = records.filter(r => r.REVIEWER_NAME === SAMPLE_DATA.adminReviewer).length;
    const reassignmentCount = records.filter(r => r.CERTIFICATION_NAME.includes('Reassignment')).length;
    const managerReviewCount = records.filter(r => r.CERTIFICATION_NAME.includes('Manager Access Review')).length;
    
    console.log('\nREVIEWER TYPE ANALYSIS:');
    console.log(`  Admin Reviews (${SAMPLE_DATA.adminReviewer}): ${adminReviewCount.toLocaleString()} records (${((adminReviewCount / records.length) * 100).toFixed(1)}%)`);
    console.log(`  Reassignments: ${reassignmentCount.toLocaleString()} records (${((reassignmentCount / records.length) * 100).toFixed(1)}%)`);
    console.log(`  Manager Reviews: ${managerReviewCount.toLocaleString()} records (${((managerReviewCount / records.length) * 100).toFixed(1)}%)`);
    
    // Top reviewers
    records.forEach(record => {
        if (record.REVIEWER_NAME !== SAMPLE_DATA.adminReviewer) {
            reviewerCounts[record.REVIEWER_NAME] = (reviewerCounts[record.REVIEWER_NAME] || 0) + 1;
        }
    });
    
    const topReviewers = Object.entries(reviewerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    console.log('\nTOP 10 REVIEWERS (excluding admin):');
    topReviewers.forEach(([name, count]) => {
        const percentage = ((count / records.length) * 100).toFixed(1);
        console.log(`  ${name}: ${count} reviews (${percentage}%)`);
    });
    
    // Gartner ODM - Access Termination Metrics
    if (CONFIG.TERMINATION_TRACKING_ENABLED) {
        const terminationRecords = records.filter(r => r.MINUTES_TO_DEPROVISION && r.MINUTES_TO_DEPROVISION !== '');

        if (terminationRecords.length > 0) {
            const deprovisionMinutes = terminationRecords.map(r => parseInt(r.MINUTES_TO_DEPROVISION));
            const avgDeprovisionMinutes = (deprovisionMinutes.reduce((a, b) => a + b, 0) / deprovisionMinutes.length).toFixed(2);
            const avgDeprovisionHours = (avgDeprovisionMinutes / 60).toFixed(2);

            console.log('\n' + '='.repeat(70));
            console.log('GARTNER ODM - ACCESS TERMINATION METRICS (V3.0: MINUTES)');
            console.log('='.repeat(70));
            console.log(`Total Termination Events: ${terminationRecords.length.toLocaleString()}`);
            console.log(`Average Minutes to Deprovision: ${avgDeprovisionMinutes} minutes (${avgDeprovisionHours} hours)`);
        }
    }
    
    console.log('\nKEY INSIGHTS:');
    console.log('  - Realistic UAR certification workflow patterns');
    console.log('  - Mix of leaver campaigns, quarterly reviews, and special access reviews');
    console.log('  - Admin reviewer handling security-sensitive reviews');
    console.log('  - Reassignment workflow for reviewer changes');
    console.log('  - Manager access reviews for elevated privileges');
    console.log('  - Configurable compliance and reviewer distribution rates');
    if (CONFIG.TERMINATION_TRACKING_ENABLED) {
        console.log('  - Gartner ODM access termination metrics included');
    }
}

// Main execution
function main() {
    // Check for command line arguments
    const summaryOnlyArg = process.argv.includes('--summary-only');
    const summaryOnly = summaryOnlyArg || CONFIG.SUMMARY_ONLY;
    
    // Check for seed argument
    const seedIndex = process.argv.findIndex(arg => arg === '--seed');
    if (seedIndex !== -1 && seedIndex + 1 < process.argv.length) {
        const seedValue = parseInt(process.argv[seedIndex + 1]);
        if (!isNaN(seedValue)) {
            CONFIG.RANDOM_SEED = seedValue;
        }
    }
    
    // Detect if output is being redirected to a file
    const isOutputRedirected = !process.stdout.isTTY;
    
    // Use console.error for status messages when output is redirected
    const statusLog = isOutputRedirected ? console.error : console.log;
    
    statusLog('🚀 Starting UAR Data Generator');
    statusLog(`🏢 Company: ${CONFIG.COMPANY_NAME}`);
    statusLog(`📊 Generating ${CONFIG.RECORD_COUNT.toLocaleString()} UAR records`);
    
    if (summaryOnly) {
        statusLog('📋 Summary-only mode enabled - showing statistics without data output');
    } else if (isOutputRedirected) {
        statusLog('📄 Output redirection detected - will save statistics to corresponding .txt file');
    }
    
    try {
        const data = generateUARData(statusLog);
        
        // Handle output redirection scenario
        if (isOutputRedirected && !summaryOnly) {
            // Generate stats string for companion file
            const statsContent = generateStatsString(data);
            
            // Create companion .txt file with timestamp for uniqueness
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
            const txtFilename = `uar_stats_${timestamp}.txt`;
            
            try {
                fs.writeFileSync(txtFilename, statsContent);
                statusLog(`📊 Statistics saved to: ${txtFilename}`);
                statusLog(`💡 Tip: When using 'node script.js > mydata.tsv', statistics are auto-saved to companion .txt file`);
            } catch (fileError) {
                statusLog(`⚠️  Could not save statistics file: ${fileError.message}`);
                statusLog('📊 Displaying statistics to stderr instead:');
                statusLog('\n' + statsContent);
            }
            
            // Output data to stdout (for redirection)
            let output;
            switch (CONFIG.OUTPUT_FORMAT.toLowerCase()) {
                case 'json':
                    output = formatAsJSON(data.records);
                    break;
                case 'csv':
                    output = formatAsCSV(data.records);
                    break;
                default:
                    output = formatAsTSV(data.records);
            }
            
            console.log(output); // This goes to the redirected file
            
        } else {
            // Normal console output or summary-only mode
            displayStats(data);
            
            // Only output data if not in summary-only mode
            if (!summaryOnly) {
                let output;
                switch (CONFIG.OUTPUT_FORMAT.toLowerCase()) {
                    case 'json':
                        output = formatAsJSON(data.records);
                        break;
                    case 'csv':
                        output = formatAsCSV(data.records);
                        break;
                    default:
                        output = formatAsTSV(data.records);
                }
                
                statusLog(`\n📤 Outputting ${data.records.length.toLocaleString()} records in ${CONFIG.OUTPUT_FORMAT.toUpperCase()} format...`);
                console.log('\n--- UAR Data (copy everything below this line) ---\n');
                console.log(output);
            }
        }
        
        statusLog('✅ UAR data generation completed successfully!');
        
    } catch (error) {
        console.error('❌ Error generating data:', error.message);
        console.error('🔧 Debug info:', error.stack);
    }
}

// Run the generator
main();