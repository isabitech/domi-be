require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

async function checkHOBranches() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('=== CHECKING HO DAILY REPORT BRANCH ISSUES ===\n');
    
    const branchesToCheck = [
      { name: 'Peace', expectedExcess: 1 },
      { name: 'Greatness', expectedExcess: 1 }, 
      { name: 'Breakthrough', expectedExcess: 2 },
      { name: 'Mandate', expectedExcess: 1 }
    ];
    
    for (const branchInfo of branchesToCheck) {
      console.log(`🔍 Checking ${branchInfo.name} Branch (Expected excess: ${branchInfo.expectedExcess}):`);
      console.log('=' .repeat(60));
      
      // Find branch by name
      const branch = await mongoose.connection.db.collection('branches')
        .findOne({ name: { $regex: new RegExp(branchInfo.name, 'i') } });
      
      if (!branch) {
        console.log(`❌ ${branchInfo.name} branch not found\n`);
        continue;
      }
      
      console.log(`✅ Found: ${branch.name} (ID: ${branch._id})`);
      console.log(`   Previous Disbursement Roll (HO): ${branch.previousDisbursementRollNo || 0}`);
      console.log(`   Previous Disbursement Amount: ${(branch.previousDisbursement || 0).toLocaleString()}`);
      
      // Get latest daily disbursement roll
      const latestDaily = await mongoose.connection.db.collection('disbursementrolls')
        .findOne(
          { branch: branch._id, date: { $exists: true } },
          { sort: { date: -1, createdAt: -1 } }
        );
      
      // Get monthly record (for comparison)
      const monthlyRecord = await mongoose.connection.db.collection('disbursementrolls')
        .findOne(
          { branch: branch._id, month: { $exists: true }, year: { $exists: true } },
          { sort: { year: -1, month: -1, createdAt: -1 } }
        );
      
      // Get actual disbursement transactions for today
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const todayTransactions = await mongoose.connection.db.collection('cashbook2')
        .find({
          branch: branch._id,
          date: { $gte: startOfDay, $lt: endOfDay },
          disbursementAmount: { $gt: 0 }
        })
        .toArray();
      
      console.log('\n📊 Current Status:');
      
      if (latestDaily) {
        console.log(`   Latest Daily Roll: ${latestDaily.disbursementRoll?.toLocaleString() || 'N/A'}`);
        console.log(`   DisNo: ${latestDaily.disNo || 'N/A'}`);
        console.log(`   Date: ${latestDaily.date ? new Date(latestDaily.date).toLocaleDateString('en-GB') : 'N/A'}`);
      } else {
        console.log('   ❌ No daily disbursement roll found');
      }
      
      if (monthlyRecord) {
        console.log(`   Monthly Roll: ${monthlyRecord.disbursementRoll?.toLocaleString() || 'N/A'}`);
        console.log(`   Monthly DisNo: ${monthlyRecord.disNo || 'N/A'}`);
      } else {
        console.log('   ❌ No monthly record found');
      }
      
      console.log(`   Today's Transactions: ${todayTransactions.length}`);
      
      if (todayTransactions.length > 0) {
        const totalDisbursed = todayTransactions.reduce((sum, tx) => sum + (tx.disbursementAmount || 0), 0);
        console.log(`   Total Disbursed Today: ${totalDisbursed.toLocaleString()}`);
        
        console.log('\n   Transaction Details:');
        todayTransactions.forEach((tx, i) => {
          console.log(`     ${i + 1}. Amount: ${tx.disbursementAmount?.toLocaleString() || 'N/A'} | ${tx.particulars || 'No description'}`);
        });
      }
      
      // Check for potential issues
      console.log('\n🔍 Potential Issues:');
      
      if (!latestDaily) {
        console.log('   ⚠️ No daily disbursement roll record found');
      } else if (!monthlyRecord) {
        console.log('   ⚠️ No monthly record found for comparison');
      } else {
        const dailyDisNo = latestDaily.disNo || 0;
        const monthlyDisNo = monthlyRecord.disNo || 0;
        const previousRollNo = branch.previousDisbursementRollNo || 0;
        
        // Calculate excess from HO baseline (previousDisbursementRollNo)
        const excessFromHO = dailyDisNo - previousRollNo;
        const excessFromMonthly = dailyDisNo - monthlyDisNo;
        
        console.log(`   Previous Roll No (HO): ${previousRollNo}`);
        console.log(`   Monthly Roll No: ${monthlyDisNo}`);
        console.log(`   Current Daily Roll No: ${dailyDisNo}`);
        console.log(`   Expected Excess (from HO): ${branchInfo.expectedExcess}`);
        console.log(`   Actual Excess (from HO): ${excessFromHO}`);
        console.log(`   Excess (from Monthly): ${excessFromMonthly}`);
        
        if (excessFromHO === branchInfo.expectedExcess) {
          console.log('   ✅ Excess matches expected value (from HO baseline)');
        } else if (excessFromHO > branchInfo.expectedExcess) {
          console.log(`   ⚠️ EXCESS HIGHER than expected by ${excessFromHO - branchInfo.expectedExcess} (from HO baseline)`);
        } else {
          console.log(`   ⚠️ EXCESS LOWER than expected by ${branchInfo.expectedExcess - excessFromHO} (from HO baseline)`);
        }
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
    }
    
    console.log('✅ HO Branch Check Complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('Disconnected from MongoDB');
    mongoose.disconnect();
  }
}

checkHOBranches();