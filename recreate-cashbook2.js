const mongoose = require('mongoose');

async function recreateMissingCashbook2() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/domi');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    const userId = '692ef319d6ea4db16c55d7ee'; // from daily ops
    const cashbook2Id = new mongoose.Types.ObjectId('693096559bc668bc7696604f'); // from daily ops
    
    console.log('=== RECREATING MISSING CASHBOOK2 RECORD ===');
    
    // Create the missing cashbook2 record with 60000 disbursement
    const cashbook2Data = {
      _id: cashbook2Id,
      branch: new mongoose.Types.ObjectId(branchId),
      user: new mongoose.Types.ObjectId(userId),
      date: new Date('2025-12-03T00:00:00.000Z'),
      disNo: 1,
      disAmt: 60000,
      savWith: 0,
      domiBank: 0,
      posT: 0,
      cbTotal2: 60000,
      createdAt: new Date('2025-12-03T19:58:13.857Z'),
      updatedAt: new Date('2025-12-03T20:05:40.890Z'),
      __v: 0
    };
    
    console.log('Creating cashbook2 record:');
    console.log(JSON.stringify(cashbook2Data, null, 2));
    
    await mongoose.connection.db.collection('cashbook2s').insertOne(cashbook2Data);
    console.log('✅ Cashbook2 record created successfully!');
    
    // Verify it was created
    const created = await mongoose.connection.db
      .collection('cashbook2s')
      .findOne({_id: cashbook2Id});
      
    if (created) {
      console.log('\\n✅ Verification: Record found in database');
      console.log(`disAmt: ${created.disAmt}`);
      console.log(`disNo: ${created.disNo}`);
    } else {
      console.log('❌ Verification failed: Record not found');
    }
    
    console.log('\\n🎯 NOW RUN YOUR MIGRATION AGAIN!');
    console.log('The disbursement roll should now calculate: 170000 + 60000 = 230000');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

recreateMissingCashbook2();