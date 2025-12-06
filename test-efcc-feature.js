const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function testEFCCFeature() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    
    console.log('=== TESTING EFCC FEATURE ===\\n');
    
    // 1. Test creating first day EFCC record
    console.log('1. TESTING FIRST DAY LOGIC:');
    
    // Clear any existing EFCC records for this branch
    await mongoose.connection.db.collection('efccs').deleteMany({
      branch: new mongoose.Types.ObjectId(branchId)
    });
    
    const firstDayData = {
      branch: new mongoose.Types.ObjectId(branchId),
      date: new Date('2025-12-01'),
      previousAmountOwing: 50000, // Initial amount owing
      todayRemittance: 10000,     // BR collected today
      amtRemittingNow: 20000      // BR remitting to HO now
    };
    
    // Calculate expected result: 50000 + 10000 - 20000 = 40000
    const expectedFirstDay = firstDayData.previousAmountOwing + firstDayData.todayRemittance - firstDayData.amtRemittingNow;
    
    await mongoose.connection.db.collection('efccs').insertOne(firstDayData);
    console.log(`First day input:`)
    console.log(`  previousAmountOwing: ${firstDayData.previousAmountOwing}`);
    console.log(`  todayRemittance: ${firstDayData.todayRemittance}`);
    console.log(`  amtRemittingNow: ${firstDayData.amtRemittingNow}`);
    console.log(`  Expected currentAmountOwing: ${expectedFirstDay}`);
    
    // 2. Test second day logic
    console.log('\\n2. TESTING SECOND DAY LOGIC:');
    
    const secondDayData = {
      branch: new mongoose.Types.ObjectId(branchId),
      date: new Date('2025-12-02'),
      previousAmountOwing: 40000, // This should be auto-calculated from previous day
      todayRemittance: 15000,     // BR collected today
      amtRemittingNow: 10000      // BR remitting to HO now
    };
    
    // Calculate expected: 40000 (from first day) + 15000 - 10000 = 45000
    const expectedSecondDay = expectedFirstDay + secondDayData.todayRemittance - secondDayData.amtRemittingNow;
    
    await mongoose.connection.db.collection('efccs').insertOne(secondDayData);
    console.log(`Second day input:`)
    console.log(`  allPreviousAmountOwing: ${expectedFirstDay} (from first day)`);
    console.log(`  todayRemittance: ${secondDayData.todayRemittance}`);
    console.log(`  amtRemittingNow: ${secondDayData.amtRemittingNow}`);
    console.log(`  Expected currentAmountOwing: ${expectedSecondDay}`);
    
    // 3. Test third day logic  
    console.log('\\n3. TESTING THIRD DAY LOGIC:');
    
    const thirdDayData = {
      branch: new mongoose.Types.ObjectId(branchId),
      date: new Date('2025-12-03'),
      previousAmountOwing: 45000, // This should be auto-calculated from previous day
      todayRemittance: 0,         // No collection today (default)
      amtRemittingNow: 5000       // BR remitting to HO now
    };
    
    // Calculate expected: 45000 (from second day) + 0 - 5000 = 40000
    const expectedThirdDay = expectedSecondDay + thirdDayData.todayRemittance - thirdDayData.amtRemittingNow;
    
    await mongoose.connection.db.collection('efccs').insertOne(thirdDayData);
    console.log(`Third day input:`)
    console.log(`  allPreviousAmountOwing: ${expectedSecondDay} (from second day)`);
    console.log(`  todayRemittance: ${thirdDayData.todayRemittance} (default 0)`);
    console.log(`  amtRemittingNow: ${thirdDayData.amtRemittingNow}`);
    console.log(`  Expected currentAmountOwing: ${expectedThirdDay}`);
    
    // 4. Verify the data was inserted correctly
    console.log('\\n4. VERIFICATION:');
    const allRecords = await mongoose.connection.db
      .collection('efccs')
      .find({branch: new mongoose.Types.ObjectId(branchId)})
      .sort({date: 1})
      .toArray();
    
    console.log(`Found ${allRecords.length} EFCC records:`);
    allRecords.forEach((record, i) => {
      console.log(`  Day ${i + 1} (${record.date.toDateString()}):`);
      console.log(`    previousAmountOwing: ${record.previousAmountOwing}`);
      console.log(`    todayRemittance: ${record.todayRemittance}`);
      console.log(`    amtRemittingNow: ${record.amtRemittingNow}`);
      console.log(`    currentAmountOwing: ${record.currentAmountOwing || 'NOT SET'}`);
      console.log('');
    });
    
    // 5. Test the formula logic
    console.log('5. FORMULA VERIFICATION:');
    const formulas = [
      { day: 1, expected: expectedFirstDay, description: '50000 + 10000 - 20000 = 40000' },
      { day: 2, expected: expectedSecondDay, description: '40000 + 15000 - 10000 = 45000' },
      { day: 3, expected: expectedThirdDay, description: '45000 + 0 - 5000 = 40000' }
    ];
    
    formulas.forEach(formula => {
      console.log(`Day ${formula.day}: ${formula.description} = ${formula.expected}`);
    });
    
    console.log('\\n✅ EFCC test data created successfully!');
    console.log('\\nNow you can test the API endpoints:');
    console.log('- GET /api/efcc/summary/all-branches (HO Dashboard)');
    console.log('- GET /api/efcc/today (BR view)');
    console.log('- POST /api/efcc/today (BR update)');
    console.log('- PATCH /api/efcc/today/submit (BR submit)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testEFCCFeature();