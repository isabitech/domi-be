const mongoose = require('mongoose');

async function addTestDisbursements() {
  try {
    await mongoose.connect('mongodb+srv://isabitechng_db_user:domi_seedstars_ng@cluster0.rf2jlcm.mongodb.net/?appName=Cluster0');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    
    console.log('=== ADDING TEST DISBURSEMENT DATA ===');
    
    // Add some test cashbook entries with disbursements
    const testDisbursements = [
      {
        branch: new mongoose.Types.ObjectId(branchId),
        date: new Date('2025-12-01'),
        disAmt: 20000,
        disNo: 1,
        cbTotal2: 20000
      },
      {
        branch: new mongoose.Types.ObjectId(branchId),
        date: new Date('2025-12-02'),
        disAmt: 15000,
        disNo: 1,
        cbTotal2: 15000
      },
      {
        branch: new mongoose.Types.ObjectId(branchId),
        date: new Date('2025-12-03'),
        disAmt: 25000,
        disNo: 2,
        cbTotal2: 25000
      }
    ];
    
    console.log('Adding test cashbook disbursements...');
    for (const disbursement of testDisbursements) {
      await mongoose.connection.db.collection('cashbook2s').insertOne(disbursement);
      console.log(`Added: Date ${disbursement.date.toDateString()}, Amount: ${disbursement.disAmt}`);
    }
    
    const totalAdded = testDisbursements.reduce((sum, d) => sum + d.disAmt, 0);
    console.log(`\nTotal test disbursements added: ${totalAdded}`);
    console.log(`Expected new disbursement roll: 170000 + ${totalAdded} = ${170000 + totalAdded}`);
    
    console.log('\\n=== NOW TEST YOUR MIGRATION AGAIN ===');
    console.log('Run your test script to see if the cumulative calculation picks up these disbursements.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

addTestDisbursements();