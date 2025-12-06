const mongoose = require('mongoose');

async function checkDailyOpsDetails() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/domi');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    
    console.log('=== CHECKING DAILY OPERATIONS DETAILS ===');
    
    const dec3Start = new Date('2025-12-03T00:00:00.000Z');
    const dec3End = new Date('2025-12-03T23:59:59.999Z');
    
    const dailyOp = await mongoose.connection.db
      .collection('dailyoperations')
      .findOne({
        branch: new mongoose.Types.ObjectId(branchId),
        date: { $gte: dec3Start, $lte: dec3End }
      });
      
    if (dailyOp) {
      console.log('Daily Operations Record:');
      console.log(JSON.stringify(dailyOp, null, 2));
      
      // Check if cashbook2 ID exists in cashbook2s collection
      if (dailyOp.cashbook2) {
        console.log('\\n=== LOOKING FOR CASHBOOK2 BY ID ===');
        const cb2 = await mongoose.connection.db
          .collection('cashbook2s')
          .findOne({_id: dailyOp.cashbook2});
          
        if (cb2) {
          console.log('Found Cashbook2:');
          console.log(JSON.stringify(cb2, null, 2));
        } else {
          console.log('❌ Cashbook2 not found with ID:', dailyOp.cashbook2);
          
          // Search for any cashbook2 records for this branch on this date
          console.log('\\n=== SEARCHING ALL CASHBOOK2 RECORDS FOR THIS DATE ===');
          const allCb2 = await mongoose.connection.db
            .collection('cashbook2s')
            .find({
              branch: new mongoose.Types.ObjectId(branchId),
              date: { $gte: new Date('2025-12-03T00:00:00.000Z'), $lte: new Date('2025-12-04T00:00:00.000Z') }
            })
            .toArray();
            
          console.log(`Found ${allCb2.length} cashbook2 records for this branch on Dec 3:`);
          allCb2.forEach(cb => {
            console.log(JSON.stringify(cb, null, 2));
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDailyOpsDetails();