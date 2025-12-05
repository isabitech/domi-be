const mongoose = require('mongoose');

async function checkDisbursementRollForDec3() {
  try {
    await mongoose.connect('mongodb+srv://isabitechng_db_user:domi_seedstars_ng@cluster0.rf2jlcm.mongodb.net/?appName=Cluster0');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    const dec3Start = new Date('2025-12-03T00:00:00.000Z');
    const dec3End = new Date('2025-12-04T00:00:00.000Z');
    
    console.log('=== CHECKING DISBURSEMENT ROLL FOR DEC 3 ===');
    
    // Check disbursement roll for Dec 3
    const disbursementRoll = await mongoose.connection.db
      .collection('disbursementrolls')
      .findOne({
        branch: new mongoose.Types.ObjectId(branchId),
        date: { $gte: dec3Start, $lt: dec3End }
      });
    
    console.log('Disbursement Roll for Dec 3:');
    if (disbursementRoll) {
      console.log(JSON.stringify(disbursementRoll, null, 2));
    } else {
      console.log('No disbursement roll found for Dec 3');
    }
    
    // Check all disbursement rolls for this branch
    console.log('\n=== ALL DISBURSEMENT ROLLS FOR BRANCH ===');
    const allRolls = await mongoose.connection.db
      .collection('disbursementrolls')
      .find({branch: new mongoose.Types.ObjectId(branchId)})
      .sort({date: 1})
      .toArray();
    
    allRolls.forEach((roll, i) => {
      console.log(`${i+1}. Date: ${roll.date}, dailyDisbursement: ${roll.dailyDisbursement}, dailyDisNo: ${roll.dailyDisNo}`);
      console.log(`   disbursementRoll: ${roll.disbursementRoll}, disNo: ${roll.disNo}`);
    });
    
    console.log('\n=== ANALYSIS ===');
    console.log('The cashbook2 record shows disAmt: 60000 for Dec 3');
    console.log('But the disbursement roll should have dailyDisbursement: 60000 for Dec 3');
    console.log('If missing, we need to trigger the upsertDisbursementRoll process');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDisbursementRollForDec3();