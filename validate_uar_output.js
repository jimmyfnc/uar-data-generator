// Simple verification script for uar_data_generator
// - Runs the generator as a child process
// - Captures stdout and saves to uar_output.csv
// - Parses first N lines and computes basic stats

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const GEN_PATH = path.resolve(__dirname, 'uar_data_generator.js');
const OUT_PATH = path.resolve(__dirname, 'uar_output.csv');
const TIMEOUT_MS = 20000; // 20s timeout

function parseCsvSimple(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return null;
  const header = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim()));
  return { header, rows };
}

function numericStats(arr) {
  const nums = arr.filter(v => typeof v === 'number' && !isNaN(v));
  if (nums.length === 0) return null;
  nums.sort((a,b)=>a-b);
  const sum = nums.reduce((a,b)=>a+b,0);
  const mean = sum / nums.length;
  const min = nums[0];
  const max = nums[nums.length-1];
  const median = nums.length % 2 === 1 ? nums[(nums.length-1)/2] : (nums[nums.length/2-1]+nums[nums.length/2])/2;
  return {count: nums.length, min, max, mean, median};
}

function runGenerator(args = []){
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [GEN_PATH, ...args], { cwd: __dirname });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(()=>{
      proc.kill('SIGKILL');
      reject(new Error('Generator timed out'));
    }, TIMEOUT_MS);

    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('error', err => { clearTimeout(timer); reject(err); });
    proc.on('close', code => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
  });
}

async function main(){
  console.log('Running generator (short) to validate CSV output...');
  try{
    // Add --seed for reproducibility
    const { code, stdout, stderr } = await runGenerator(['--seed', '12345']);

    if (stderr && stderr.trim().length > 0) {
      console.error('Generator stderr:\n', stderr);
    }

    if (!stdout || stdout.trim().length === 0) {
      console.error('Generator produced no stdout; cannot validate CSV.');
      process.exit(2);
    }

    // Save full stdout to CSV
    fs.writeFileSync(OUT_PATH, stdout, 'utf8');
    console.log('Saved generator stdout to', OUT_PATH);

    // Parse simple CSV
    const parsed = parseCsvSimple(stdout);
    if (!parsed) {
      console.error('Failed to parse any CSV lines.');
      process.exit(3);
    }

    const { header, rows } = parsed;
    console.log('Header columns:', header.length);
    console.log('Sample header:', header.slice(0,10).join(', '));
    console.log('Record rows captured:', rows.length);

    // Try to detect compliance column
    const complianceCandidates = ['Compliance Status','COMPLIANCE_STATUS','compliance_status','Compliance'];
    const compIdx = header.findIndex(h => complianceCandidates.includes(h));
    if (compIdx === -1) {
      console.warn('Compliance column not found in header. Searched for:', complianceCandidates.join(', '));
    } else {
      const vals = rows.map(r => r[compIdx] || '').filter(Boolean);
      const trueCount = vals.filter(v => /^(TRUE|Compliant|true|Yes|Y)$/i.test(v)).length;
      const falseCount = vals.filter(v => /^(FALSE|Not Compliant|false|No|N)$/i.test(v)).length;
      console.log(`Compliance values: TRUE-like=${trueCount}, FALSE-like=${falseCount}, totalChecked=${vals.length}`);
    }

    // Minutes To Deprovision column
    const mCandidates = ['Minutes To Deprovision','MINUTES_TO_DEPROVISION','Minutes_To_Deprovision','MinutesToDeprovision'];
    const minIdx = header.findIndex(h => mCandidates.includes(h));
    if (minIdx === -1) {
      console.warn('Minutes To Deprovision column not found. Searched for:', mCandidates.join(', '));
    } else {
      const nums = rows.map(r => {
        const v = r[minIdx] ? r[minIdx].replace(/[^0-9.-]/g,'') : '';
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
      }).filter(v => v !== null);
      const stats = numericStats(nums);
      console.log('Minutes To Deprovision stats:', stats);
    }

    // Basic checks
    if (header.length >= 1 && rows.length >= 1) {
      console.log('Basic CSV checks passed (header + rows detected).');
      process.exit(0);
    } else {
      console.error('CSV missing header or rows.');
      process.exit(4);
    }

  }catch(err){
    console.error('Error running validation:', err.message || err);
    process.exit(1);
  }
}

main();
