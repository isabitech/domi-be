const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function clearEFCCTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Branch IDs to clear
    const branchIds = [
      ""// Also clear the original test branch
    ];
    
    console.log('=== CLEARING EFCC TEST DATA ===\\n');
    
    let totalDeleted = 0;
    
    for (const branchId of branchIds) {
      console.log(`Clearing EFCC records for branch: ${branchId}`);
      
      // Check existing records first
      const existingRecords = await mongoose.connection.db
        .collection('efccs')
        .find({branch: new mongoose.Types.ObjectId(branchId)})
        .toArray();
        
      console.log(`  Found ${existingRecords.length} EFCC records`);
      
      if (existingRecords.length > 0) {
        // Show what we're about to delete
        existingRecords.forEach((record, i) => {
          console.log(`    ${i + 1}. Date: ${record.date?.toDateString()}, Amount Owing: ₦${(record.currentAmountOwing || 0).toLocaleString()}`);
        });
        
        // Delete all EFCC records for this branch
        const deleteResult = await mongoose.connection.db
          .collection('efccs')
          .deleteMany({branch: new mongoose.Types.ObjectId(branchId)});
          
        console.log(`  ✅ Deleted ${deleteResult.deletedCount} EFCC records\\n`);
        totalDeleted += deleteResult.deletedCount;
      } else {
        console.log(`  ℹ️  No EFCC records found for this branch\\n`);
      }
    }
    
    console.log('=== CLEANUP SUMMARY ===');
    console.log(`Total EFCC records deleted: ${totalDeleted}`);
    console.log('Branches cleaned:');
    branchIds.forEach(id => console.log(`  - ${id}`));
    
    if (totalDeleted > 0) {
      console.log('\\n✅ Test data cleared successfully!');
      console.log('The EFCC collections are now clean and ready for production use.');
    } else {
      console.log('\\nℹ️  No test data found to clean.');
    }
    
  } catch (error) {
    console.error('❌ Error clearing EFCC test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\\nDisconnected from MongoDB');
  }
}

clearEFCCTestData();