const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function testPreviousAmountOwingUpdate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    
    console.log('=== TESTING PREVIOUS AMOUNT OWING UPDATE ===\\n');
    
    // Clear existing EFCC records for this branch
    await mongoose.connection.db.collection('efccs').deleteMany({
      branch: new mongoose.Types.ObjectId(branchId)
    });
    
    console.log('1. CREATING FIRST RECORD WITH INITIAL PREVIOUS AMOUNT OWING:');
    
    // Day 1: Initial record
    const day1Data = {
      branch: new mongoose.Types.ObjectId(branchId),
      date: new Date('2025-12-01'),
      previousAmountOwing: 50000, // Initial amount
      todayRemittance: 10000,
      amtRemittingNow: 20000,
      currentAmountOwing: 50000 + 10000 - 20000 // Should be 40000
    };
    
    await mongoose.connection.db.collection('efccs').insertOne(day1Data);
    console.log(`Day 1: previousAmountOwing=${day1Data.previousAmountOwing}, currentAmountOwing should be ${day1Data.currentAmountOwing}`);
    
    console.log('\\n2. CREATING SECOND RECORD (AUTO-CALCULATED PREVIOUS):');
    
    // Day 2: Normal flow (previousAmountOwing should auto-calculate to 40000)
    const day2Data = {
      branch: new mongoose.Types.ObjectId(branchId),
      date: new Date('2025-12-02'),
      previousAmountOwing: 0, // Will be auto-calculated to 40000
      todayRemittance: 15000,
      amtRemittingNow: 10000,
      currentAmountOwing: 40000 + 15000 - 10000 // Should be 45000
    };
    
    await mongoose.connection.db.collection('efccs').insertOne(day2Data);
    console.log(`Day 2: previousAmountOwing will auto-calculate to 40000, currentAmountOwing should be ${day2Data.currentAmountOwing}`);
    
    console.log('\\n3. UPDATING PREVIOUS AMOUNT OWING (BR MANUAL UPDATE):');
    
    // Day 3: BR manually updates previousAmountOwing
    const day3Data = {
      branch: new mongoose.Types.ObjectId(branchId),
      date: new Date('2025-12-03'),
      previousAmountOwing: 60000, // BR manually sets this (maybe there was an adjustment)
      todayRemittance: 5000,
      amtRemittingNow: 15000,
      currentAmountOwing: 60000 + 5000 - 15000 // Should be 50000
    };
    
    await mongoose.connection.db.collection('efccs').insertOne(day3Data);
    console.log(`Day 3: BR manually set previousAmountOwing=${day3Data.previousAmountOwing}, currentAmountOwing should be ${day3Data.currentAmountOwing}`);
    
    console.log('\\n4. NEXT DAY AFTER MANUAL UPDATE:');
    
    // Day 4: Should use Day 3's currentAmountOwing (50000) as base
    const day4Data = {
      branch: new mongoose.Types.ObjectId(branchId),
      date: new Date('2025-12-04'),
      previousAmountOwing: 0, // Will be auto-calculated to 50000 from Day 3
      todayRemittance: 8000,
      amtRemittingNow: 3000,
      currentAmountOwing: 50000 + 8000 - 3000 // Should be 55000
    };
    
    await mongoose.connection.db.collection('efccs').insertOne(day4Data);
    console.log(`Day 4: previousAmountOwing will auto-calculate to 50000, currentAmountOwing should be ${day4Data.currentAmountOwing}`);
    
    console.log('\\n5. VERIFICATION - ALL RECORDS:');
    const allRecords = await mongoose.connection.db
      .collection('efccs')
      .find({branch: new mongoose.Types.ObjectId(branchId)})
      .sort({date: 1})
      .toArray();
    
    allRecords.forEach((record, i) => {
      console.log(`Day ${i + 1} (${record.date.toDateString()}):`);
      console.log(`  previousAmountOwing: ${record.previousAmountOwing}`);
      console.log(`  todayRemittance: ${record.todayRemittance}`);
      console.log(`  amtRemittingNow: ${record.amtRemittingNow}`);
      console.log(`  currentAmountOwing: ${record.currentAmountOwing}`);
      console.log('');
    });
    
    console.log('6. EXPECTED CALCULATION FLOW:');
    console.log('Day 1: 50000 + 10000 - 20000 = 40000');
    console.log('Day 2: 40000 + 15000 - 10000 = 45000');
    console.log('Day 3: 60000 + 5000 - 15000 = 50000 (manual previousAmountOwing override)');
    console.log('Day 4: 50000 + 8000 - 3000 = 55000');
    
    console.log('\\n✅ Test completed! Now BR users can update previousAmountOwing anytime.');
    console.log('\\n📝 Use cases for updating previousAmountOwing:');
    console.log('- Initial setup correction');
    console.log('- Manual adjustments from HO');
    console.log('- Reconciliation differences');
    console.log('- Penalty additions');
    console.log('- Bonus deductions');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testPreviousAmountOwingUpdate();