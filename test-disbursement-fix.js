const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function testDisbursementRollFix() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/domi');
    console.log('Connected to MongoDB');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    
    console.log('=== TESTING DISBURSEMENT ROLL FIX ===');
    
    // 1. Check current disbursement rolls
    console.log('\n1. CURRENT DISBURSEMENT ROLLS:');
    const currentRolls = await mongoose.connection.db
      .collection('disbursementrolls')
      .find({branch: new mongoose.Types.ObjectId(branchId)})
      .sort({date: 1})
      .toArray();
      
    console.log(`Found ${currentRolls.length} current disbursement rolls`);
    currentRolls.forEach((roll, i) => {
      console.log(`${i+1}. Date: ${roll.date.toDateString()}`);
      console.log(`   - previousDisbursement: ${roll.previousDisbursement || 'MISSING'}`);
      console.log(`   - dailyDisbursement: ${roll.dailyDisbursement || 'MISSING'}`);
      console.log(`   - disbursementRoll: ${roll.disbursementRoll}`);
      console.log(`   - currentDayDisbursementRollNo: ${roll.currentDayDisbursementRollNo || 'OLD FIELD'}`);
      console.log(`   - disNo: ${roll.disNo}`);
      console.log('');
    });
    
    // 2. Check all cashbook disbursement data
    console.log('\\n2. CASHBOOK DISBURSEMENT DATA:');
    const cashbookData = await mongoose.connection.db
      .collection('cashbook2s')
      .find({
        branch: new mongoose.Types.ObjectId(branchId),
        $or: [
          { disAmt: { $exists: true, $gt: 0 } },
          { disNo: { $exists: true, $gt: 0 } }
        ]
      })
      .sort({date: 1})
      .toArray();
      
    console.log(`Found ${cashbookData.length} cashbook records with disbursements`);
    let totalCashbookAmounts = 0;
    let totalCashbookNumbers = 0;
    
    cashbookData.forEach((cb, i) => {
      totalCashbookAmounts += cb.disAmt || 0;
      totalCashbookNumbers += cb.disNo || 0;
      console.log(`${i+1}. Date: ${cb.date.toDateString()}, disAmt: ${cb.disAmt || 0}, disNo: ${cb.disNo || 0}`);
    });
    
    // 3. Check branch baseline
    console.log('\\n3. BRANCH BASELINE:');
    const branch = await mongoose.connection.db
      .collection('branches')
      .findOne({_id: new mongoose.Types.ObjectId(branchId)});
      
    if (branch) {
      console.log(`Branch previousDisbursement (amount baseline): ${branch.previousDisbursement || 'NOT SET'}`);
      console.log(`Branch previousDisbursementRollNo (number baseline): ${branch.previousDisbursementRollNo || 'NOT SET'}`);
    }
    
    // 4. Calculate expected values
    console.log('\\n4. EXPECTED CALCULATION (based on PRD):');
    const expectedAmount = (branch?.previousDisbursement || 0) + totalCashbookAmounts;
    const expectedNumber = (branch?.previousDisbursementRollNo || 0) + totalCashbookNumbers;
    
    console.log(`disbursementRoll = previousDisbursement + totalCashbookAmounts`);
    console.log(`                 = ${branch?.previousDisbursement || 0} + ${totalCashbookAmounts}`);
    console.log(`                 = ${expectedAmount}`);
    console.log(``);
    console.log(`disNo = previousDisbursementRollNo + totalCashbookNumbers`);
    console.log(`      = ${branch?.previousDisbursementRollNo || 0} + ${totalCashbookNumbers}`);
    console.log(`      = ${expectedNumber}`);
    
    // 5. Check if current values match expected
    if (currentRolls.length > 0) {
      const latest = currentRolls[currentRolls.length - 1];
      console.log('\\n5. CURRENT VS EXPECTED:');
      console.log(`Current disbursementRoll: ${latest.disbursementRoll}`);
      console.log(`Expected disbursementRoll: ${expectedAmount}`);
      console.log(`Amount calculation correct: ${latest.disbursementRoll === expectedAmount ? '✅ YES' : '❌ NO'}`);
      console.log(``);
      console.log(`Current disNo: ${latest.disNo}`);
      console.log(`Expected disNo: ${expectedNumber}`);
      console.log(`Number calculation correct: ${latest.disNo === expectedNumber ? '✅ YES' : '❌ NO'}`);
    }
    
    console.log('\\n=== SUMMARY ===');
    if (currentRolls.some(roll => !roll.previousDisbursement)) {
      console.log('❌ Issue: Some disbursement rolls missing previousDisbursement field');
    }
    if (currentRolls.some(roll => !roll.dailyDisbursement && roll.dailyDisbursement !== 0)) {
      console.log('❌ Issue: Some disbursement rolls missing dailyDisbursement field');
    }
    if (currentRolls.length > 0) {
      const latest = currentRolls[currentRolls.length - 1];
      if (latest.disbursementRoll === expectedAmount && latest.disNo === expectedNumber) {
        console.log('✅ Disbursement roll calculation is CORRECT!');
      } else {
        console.log('❌ Disbursement roll calculation is INCORRECT - needs fixing');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDisbursementRollFix();