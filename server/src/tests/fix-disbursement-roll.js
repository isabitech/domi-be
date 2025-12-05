const mongoose = require('mongoose');

// Import the models (we'll need to replicate the schema)
const DisbursementRollSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  date: { type: Date, required: true, default: Date.now },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  previousDisbursement: { type: Number, default: 0 },
  previousDisbursementRollNo: { type: Number, default: 0 },
  dailyDisbursement: { type: Number, default: 0 },
  dailyDisNo: { type: Number, default: 0 },
  disbursementRoll: { type: Number, default: 0 },
  disNo: { type: Number, default: 0 },
}, { timestamps: true });

// Add the cumulative calculation method
DisbursementRollSchema.methods.calculateCumulativeDisbursement = async function() {
  const DisbursementRoll = this.constructor;
  
  // Get all previous disbursement roll entries for this branch before current date
  const previousEntries = await DisbursementRoll.find({
    branch: this.branch,
    date: { $lt: this.date }
  }).sort({ date: 1 }).lean();
  
  // Sum up all previous days' disbursements and numbers
  const cumulativePreviousDisbursement = previousEntries.reduce((sum, entry) => {
    return sum + (entry.dailyDisbursement || 0);
  }, 0);
  
  const cumulativePreviousNumbers = previousEntries.reduce((sum, entry) => {
    return sum + (entry.dailyDisNo || 0);
  }, 0);
  
  // Final cumulative calculations
  this.disbursementRoll = (this.previousDisbursement || 0) + cumulativePreviousDisbursement + (this.dailyDisbursement || 0);
  this.disNo = (this.previousDisbursementRollNo || 0) + cumulativePreviousNumbers + (this.dailyDisNo || 0);
};

async function fixMissingDisbursementRoll() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/domi');
    
    const DisbursementRoll = mongoose.model('DisbursementRoll', DisbursementRollSchema);
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    
    console.log('=== FIXING MISSING DISBURSEMENT ROLL FOR DEC 3 ===');
    
    // Get branch metadata for baseline values
    const branch = await mongoose.connection.db
      .collection('branches')
      .findOne({_id: new mongoose.Types.ObjectId(branchId)});
    
    // Create disbursement roll for Dec 3rd with the cashbook2 data
    const dec3Date = new Date('2025-12-03T00:00:00.000Z');
    
    const newRoll = new DisbursementRoll({
      branch: new mongoose.Types.ObjectId(branchId),
      date: dec3Date,
      month: 12,
      year: 2025,
      previousDisbursement: branch.previousDisbursement || 170000,
      previousDisbursementRollNo: branch.previousDisbursementRollNo || 2,
      dailyDisbursement: 60000, // From the cashbook2 disAmt
      dailyDisNo: 1 // From the cashbook2 disNo
    });
    
    // Calculate cumulative values
    await newRoll.calculateCumulativeDisbursement();
    
    console.log('Creating new disbursement roll entry:');
    console.log(`- Date: ${newRoll.date}`);
    console.log(`- dailyDisbursement: ${newRoll.dailyDisbursement}`);
    console.log(`- dailyDisNo: ${newRoll.dailyDisNo}`);
    console.log(`- disbursementRoll: ${newRoll.disbursementRoll}`);
    console.log(`- disNo: ${newRoll.disNo}`);
    
    // Save the new roll
    await mongoose.connection.db.collection('disbursementrolls').insertOne(newRoll.toObject());
    
    console.log('✅ Successfully created disbursement roll for Dec 3');
    
    // Now recalculate all subsequent entries
    console.log('\\n=== RECALCULATING SUBSEQUENT ENTRIES ===');
    
    const subsequentRolls = await DisbursementRoll.find({
      branch: new mongoose.Types.ObjectId(branchId),
      date: { $gt: dec3Date }
    }).sort({ date: 1 });
    
    for (const roll of subsequentRolls) {
      const oldDisbursementRoll = roll.disbursementRoll;
      const oldDisNo = roll.disNo;
      
      await roll.calculateCumulativeDisbursement();
      
      await mongoose.connection.db.collection('disbursementrolls').updateOne(
        { _id: roll._id },
        { 
          $set: { 
            disbursementRoll: roll.disbursementRoll,
            disNo: roll.disNo
          }
        }
      );
      
      console.log(`Updated ${roll.date}: ${oldDisbursementRoll} → ${roll.disbursementRoll}, ${oldDisNo} → ${roll.disNo}`);
    }
    
    console.log('\\n🎉 All disbursement rolls fixed!');
    console.log('Expected disbursement roll: 170000 + 60000 = 230000');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixMissingDisbursementRoll();