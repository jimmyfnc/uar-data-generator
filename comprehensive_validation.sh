#!/bin/bash
echo "======================================================================"
echo "UAR DATA GENERATOR V3.0 - COMPREHENSIVE VALIDATION REPORT"
echo "======================================================================"
echo ""

CSV_FILE="uar_output.csv"

echo "1. COLUMN COUNT"
echo "---------------"
COL_COUNT=$(head -1 "$CSV_FILE" | awk -F',' '{print NF}')
echo "   Total columns: $COL_COUNT (Expected: 45)"
echo ""

echo "2. COMPLIANCE STATUS (TARGET: 93%)"
echo "-----------------------------------"
awk -F',' 'NR>1 {total++; if($15=="TRUE") compliant++} END {
    rate = (compliant/total)*100;
    printf "   Compliant: %d / %d = %.2f%%\n", compliant, total, rate;
    printf "   Non-Compliant: %d = %.2f%%\n", total-compliant, ((total-compliant)/total)*100;
}' "$CSV_FILE"
echo ""

echo "3. DEPROVISION COMPLIANCE STATUS (TARGET: 85%)"
echo "-----------------------------------------------"
awk -F',' 'NR>1 && $44!="" {total++; if($45=="TRUE") compliant++} END {
    rate = (compliant/total)*100;
    printf "   Compliant: %d / %d = %.2f%%\n", compliant, total, rate;
    printf "   Non-Compliant: %d = %.2f%%\n", total-compliant, ((total-compliant)/total)*100;
    printf "   SLA: 1440 minutes (24 hours)\n";
}' "$CSV_FILE"
echo ""

echo "4. CAMPAIGN DISTRIBUTION (TARGET: 35% Leaver, 45% Quarterly, 20% Special)"
echo "---------------------------------------------------------------------------"
awk -F',' 'NR>1 {total++; campaign=$5;
    if(campaign ~ /Leaver/) leaver++;
    else if(campaign ~ /Quarterly/) quarterly++;
    else special++;  # Everything else is special access
} END {
    printf "   Leaver: %d (%.2f%%) - Target: 35%%\n", leaver, (leaver/total)*100;
    printf "   Quarterly: %d (%.2f%%) - Target: 45%%\n", quarterly, (quarterly/total)*100;
    printf "   Special: %d (%.2f%%) - Target: 20%%\n", special, (special/total)*100;
}' "$CSV_FILE"
echo ""

echo "5. CERTIFICATION STATUS DISTRIBUTION"
echo "-------------------------------------"
awk -F',' 'NR>1 {total++; status[$14]++} END {
    for(s in status) 
        printf "   %s: %d (%.2f%%)\n", s, status[s], (status[s]/total)*100;
    printf "   Target: CLOSED 75%%, NEW 15%%, IN PROGRESS 10%%\n";
}' "$CSV_FILE" | sort
echo ""

echo "6. DATE FORMAT VALIDATION"
echo "-------------------------"
awk -F',' 'NR==2 {
    printf "   Campaign Created: %s (Format: M/D/YYYY h:mm:ss AM/PM)\n", $1;
    printf "   Campaign Load Date: %s (Format: M/D/YY)\n", $4;
}' "$CSV_FILE"
echo ""

echo "7. BOOLEAN FORMAT VALIDATION"
echo "-----------------------------"
awk -F',' 'NR==2 {
    printf "   Compliance Status: %s\n", $15;
    printf "   Certification Completed: %s\n", $7;
    printf "   Is Active Campaign: %s\n", $21;
    printf "   Is Current: %s\n", $22;
    printf "   (All should be TRUE or FALSE)\n";
}' "$CSV_FILE"
echo ""

echo "8. NEW V3 COLUMNS"
echo "-----------------"
awk -F',' 'NR==2 {
    printf "   Past Due: [%s]\n", $29;
    printf "   User Access Grouping: %s\n", $37;
    printf "   Data as of: %s\n", $40;
    printf "   Due in Days: %s\n", $41;
}' "$CSV_FILE"
echo ""

echo "9. ODM COLUMNS"
echo "--------------"
awk -F',' 'NR>1 && $44!="" {count++; minutes+=$44} END {
    printf "   Records with ODM data: %d (%.2f%%)\n", count, (count/NR-1)*100;
    printf "   Avg Minutes To Deprovision: %.2f (%.2f hours)\n", minutes/count, (minutes/count)/60;
    printf "   Target avg: 480 minutes (8 hours)\n";
}' "$CSV_FILE"
echo ""

echo "10. RECORD COUNT"
echo "----------------"
RECORD_COUNT=$(wc -l < "$CSV_FILE")
RECORD_COUNT=$((RECORD_COUNT - 1))
echo "   Total records: $RECORD_COUNT (Expected: 30,000)"
echo ""

echo "======================================================================"
echo "VALIDATION COMPLETE"
echo "======================================================================"
