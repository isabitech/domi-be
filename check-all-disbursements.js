const mongoose = require('mongoose');

async function checkAllDisbursements() {
  try {
    await mongoose.connect('mongodb+srv://isabitechng_db_user:domi_seedstars_ng@cluster0.rf2jlcm.mongodb.net/?appName=Cluster0');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    
    console.log('=== CHECKING ALL DISBURSEMENT-RELATED RECORDS ===');
    
    // Check all disbursement rolls for this branch
    console.log('\n1. ALL DISBURSEMENT ROLLS:');
    const allDisbursementRolls = await mongoose.connection.db
      .collection('disbursementrolls')
      .find({branch: new mongoose.Types.ObjectId(branchId)})
      .sort({date: 1})
      .toArray();
    
    console.log(`Found ${allDisbursementRolls.length} disbursement roll records`);
    allDisbursementRolls.forEach((roll, i) => {
      console.log(`${i+1}. ${JSON.stringify(roll, null, 2)}`);
    });
    
    // Check cashbook records for disbursements
    console.log('\n2. CASHBOOK DISBURSEMENTS:');
    const cashbookDisbursements = await mongoose.connection.db
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
    
    console.log(`Found ${cashbookDisbursements.length} cashbook disbursement records`);
    let totalCashbookDis = 0;
    cashbookDisbursements.forEach((cb, i) => {
      totalCashbookDis += cb.disAmt || 0;
      console.log(`${i+1}. Date: ${cb.date}, disAmt: ${cb.disAmt}, disNo: ${cb.disNo}`);
    });
    
    console.log(`\nTotal cashbook disbursements: ${totalCashbookDis}`);
    
    // Check branch baseline
    console.log('\n3. BRANCH BASELINE:');
    const branch = await mongoose.connection.db
      .collection('branches')
      .findOne({_id: new mongoose.Types.ObjectId(branchId)});
      
    if (branch) {
      console.log(`Branch previousDisbursement: ${branch.previousDisbursement}`);
      console.log(`Branch previousDisbursementRollNo: ${branch.previousDisbursementRollNo}`);
    }
    
    console.log('\n=== ANALYSIS ===');
    console.log(`Expected calculation:`);
    console.log(`previousDisbursement (${branch?.previousDisbursement || 0}) + totalCashbookDis (${totalCashbookDis}) = ${(branch?.previousDisbursement || 0) + totalCashbookDis}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllDisbursements();