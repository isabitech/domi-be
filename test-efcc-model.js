const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function testEFCCCalculationLogic() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Import the EFCC model using ES modules approach
    const { default: EFCC } = await import('./server/src/models/EFCC.js');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    
    console.log('=== TESTING EFCC MODEL CALCULATION LOGIC ===\\n');
    
    // Clear existing EFCC records for this branch
    await EFCC.deleteMany({ branch: branchId });
    console.log('Cleared existing EFCC records\\n');
    
    // Test 1: First day record
    console.log('1. TESTING FIRST DAY RECORD:');
    const firstDay = new EFCC({
      branch: branchId,
      date: new Date('2025-12-01'),
      previousAmountOwing: 50000,
      todayRemittance: 10000,
      amtRemittingNow: 20000
    });
    
    await firstDay.save();
    console.log(`First day result:`)
    console.log(`  Input: 50000 (prev) + 10000 (today) - 20000 (remit) = 40000`)
    console.log(`  Calculated: ${firstDay.currentAmountOwing}`)
    console.log(`  Correct: ${firstDay.currentAmountOwing === 40000 ? '✅' : '❌'}\\n`);
    
    // Test 2: Second day record
    console.log('2. TESTING SECOND DAY RECORD:');
    const secondDay = new EFCC({
      branch: branchId,
      date: new Date('2025-12-02'),
      todayRemittance: 15000,
      amtRemittingNow: 10000
    });
    
    await secondDay.save();
    console.log(`Second day result:`)
    console.log(`  Input: 40000 (from prev day) + 15000 (today) - 10000 (remit) = 45000`)
    console.log(`  Calculated: ${secondDay.currentAmountOwing}`)
    console.log(`  Previous Amount Owing: ${secondDay.previousAmountOwing}`)
    console.log(`  Correct: ${secondDay.currentAmountOwing === 45000 ? '✅' : '❌'}\\n`);
    
    // Test 3: Third day record
    console.log('3. TESTING THIRD DAY RECORD:');
    const thirdDay = new EFCC({
      branch: branchId,
      date: new Date('2025-12-03'),
      todayRemittance: 0,
      amtRemittingNow: 5000
    });
    
    await thirdDay.save();
    console.log(`Third day result:`)
    console.log(`  Input: 45000 (from prev day) + 0 (today) - 5000 (remit) = 40000`)
    console.log(`  Calculated: ${thirdDay.currentAmountOwing}`)
    console.log(`  Previous Amount Owing: ${thirdDay.previousAmountOwing}`)
    console.log(`  Correct: ${thirdDay.currentAmountOwing === 40000 ? '✅' : '❌'}\\n`);
    
    // Test 4: Test the static methods
    console.log('4. TESTING STATIC METHODS:');
    const latest = await EFCC.getLatestForBranch(branchId);
    console.log(`Latest record current amount owing: ${latest.currentAmountOwing}`)
    console.log(`Should be 40000: ${latest.currentAmountOwing === 40000 ? '✅' : '❌'}\\n`);
    
    // Test 5: Test upsertToday method
    console.log('5. TESTING UPSERT TODAY METHOD:');
    const todayRecord = await EFCC.upsertToday(branchId, {
      todayRemittance: 8000,
      amtRemittingNow: 3000
    }, new mongoose.Types.ObjectId());
    
    console.log(`Today upsert result:`)
    console.log(`  Input: 40000 (from prev day) + 8000 (today) - 3000 (remit) = 45000`)
    console.log(`  Calculated: ${todayRecord.currentAmountOwing}`)
    console.log(`  Correct: ${todayRecord.currentAmountOwing === 45000 ? '✅' : '❌'}\\n`);
    
    console.log('6. VERIFICATION - ALL RECORDS:');
    const allRecords = await EFCC.find({ branch: branchId }).sort({ date: 1 });
    allRecords.forEach((record, i) => {
      console.log(`  Day ${i + 1} (${record.date.toDateString()}): ${record.currentAmountOwing}`);
    });
    
    console.log('\\n✅ EFCC Model calculation logic test completed!');
    console.log('\\nThe server is running and ready to test API endpoints.');
    console.log('You can now test the endpoints at http://localhost:5000/api/efcc/');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testEFCCCalculationLogic();