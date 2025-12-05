const mongoose = require('mongoose');

async function checkCashbook2December3() {
  try {
    await mongoose.connect('mongodb+srv://isabitechng_db_user:domi_seedstars_ng@cluster0.rf2jlcm.mongodb.net/?appName=Cluster0');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    
    console.log('=== CHECKING CASHBOOK2 FOR DECEMBER 3, 2025 ===');
    
    // Check for December 3rd specifically
    const dec3Start = new Date('2025-12-03T00:00:00.000Z');
    const dec3End = new Date('2025-12-03T23:59:59.999Z');
    
    console.log(`Looking for cashbook2 records between:`);
    console.log(`Start: ${dec3Start}`);
    console.log(`End: ${dec3End}`);
    
    const cashbook2Records = await mongoose.connection.db
      .collection('cashbook2s')
      .find({
        branch: new mongoose.Types.ObjectId(branchId),
        date: { $gte: dec3Start, $lte: dec3End }
      })
      .toArray();
    
    console.log(`\\nFound ${cashbook2Records.length} cashbook2 records for December 3rd:`);
    cashbook2Records.forEach((cb, i) => {
      console.log(`${i+1}. ${JSON.stringify(cb, null, 2)}`);
    });
    
    if (cashbook2Records.length > 0) {
      const total = cashbook2Records.reduce((sum, cb) => sum + (cb.disAmt || 0), 0);
      console.log(`\\nTotal disbursements on Dec 3: ${total}`);
    }
    
    // Also check DailyOperations for Dec 3rd
    console.log('\\n=== CHECKING DAILY OPERATIONS FOR DECEMBER 3RD ===');
    const dailyOps = await mongoose.connection.db
      .collection('dailyoperations')
      .find({
        branch: new mongoose.Types.ObjectId(branchId),
        date: { $gte: dec3Start, $lte: dec3End }
      })
      .toArray();
      
    console.log(`Found ${dailyOps.length} daily operations for December 3rd:`);
    for (const op of dailyOps) {
      const cb2 = await mongoose.connection.db
        .collection('cashbook2s')
        .findOne({_id: op.cashbook2});
      console.log(`DailyOp: ${op._id}`);
      console.log(`Cashbook2: ${cb2 ? cb2.disAmt : 'Not found'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkCashbook2December3();