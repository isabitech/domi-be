import mongoose from 'mongoose';

const migrateDisbursementRoll = async () => {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URI || 'mongodb+srv://dominionglobalfirms:iuwPGxzCLIz4lV3C@cluster0.rf2jlcm.mongodb.net/dominion_backend?retryWrites=true&w=majority';
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB for migration');

    // Get the collection directly
    const db = mongoose.connection.db;
    const collection = db.collection('disbursementrolls');
    
    // Find all records with old fields
    const records = await collection.find({}).toArray();
    console.log(`Found ${records.length} disbursement roll records`);

    for (const record of records) {
      const updates = {};
      
      // Migrate currentDisbursementNo to dailyDisNo
      if (record.currentDisbursementNo !== undefined) {
        updates.dailyDisNo = record.currentDisbursementNo;
        updates.$unset = { currentDisbursementNo: 1, cumulativeDisNo: 1 };
        console.log(`Migrating record ${record._id}`);
      }
      
      // Ensure dailyDisNo exists
      if (record.dailyDisNo === undefined && !updates.dailyDisNo) {
        updates.dailyDisNo = 0;
      }

      // Update record if needed
      if (Object.keys(updates).length > 0) {
        await collection.updateOne({ _id: record._id }, updates);
        console.log(`Updated record ${record._id}`);
      }
    }

    console.log('Migration completed!');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

// Run the migration
migrateDisbursementRoll();