const mongoose = require('mongoose');

async function checkDisbursements() {
  try {
    // Use the correct connection string from server config
    await mongoose.connect('mongodb+srv://isabitechng_db_user:domi_seedstars_ng@cluster0.rf2jlcm.mongodb.net/?appName=Cluster0');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    const disbursementRolls = await mongoose.connection.db
      .collection('disbursementrolls')
      .find({branch: new mongoose.Types.ObjectId(branchId)})
      .sort({date: 1})
      .toArray();
    
    console.log(`All disbursement rolls for branch ${branchId}:`);
    console.log('=====================================');
    
    let totalDaily = 0;
    disbursementRolls.forEach((roll, i) => {
      const dailyDisbursement = roll.dailyDisbursement || 0;
      totalDaily += dailyDisbursement;
      
      console.log(`${i+1}. Date: ${roll.date}`);
      console.log(`   dailyDisbursement: ${dailyDisbursement}`);
      console.log(`   dailyDisNo: ${roll.dailyDisNo || 0}`);
      console.log(`   disbursementRoll: ${roll.disbursementRoll}`);
      console.log(`   disNo: ${roll.disNo}`);
      console.log(`   previousDisbursement: ${roll.previousDisbursement}`);
      console.log(`   Running total of dailyDisbursement: ${totalDaily}`);
      console.log('   ---');
    });
    
    console.log(`\\nSUMMARY:`);
    console.log(`Total records: ${disbursementRolls.length}`);
    console.log(`Total of all dailyDisbursement: ${totalDaily}`);
    console.log(`Previous disbursement (baseline): 170000`);
    console.log(`Expected disbursementRoll: 170000 + ${totalDaily} = ${170000 + totalDaily}`);
    
    if (disbursementRolls.length > 0) {
      const latest = disbursementRolls[disbursementRolls.length - 1];
      console.log(`Current disbursementRoll: ${latest.disbursementRoll}`);
      console.log(`Calculation correct: ${latest.disbursementRoll === 170000 + totalDaily ? 'YES' : 'NO'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDisbursements();