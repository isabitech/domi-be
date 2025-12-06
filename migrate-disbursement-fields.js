const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function migrateDisbursementRollFields() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/domi');
    console.log('Connected to MongoDB');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    
    console.log('=== MIGRATING DISBURSEMENT ROLL FIELDS ===');
    
    // Get branch baseline values
    const branch = await mongoose.connection.db
      .collection('branches')
      .findOne({_id: new mongoose.Types.ObjectId(branchId)});
      
    console.log(`Branch previousDisbursement: ${branch?.previousDisbursement || 'NOT SET'}`);
    console.log(`Branch previousDisbursementRollNo: ${branch?.previousDisbursementRollNo || 'NOT SET'}`);
    
    // If branch doesn't have previousDisbursement set, set it to 170000 (baseline from PRD)
    if (!branch?.previousDisbursement) {
      console.log('Setting branch previousDisbursement to 170000 (baseline)');
      await mongoose.connection.db
        .collection('branches')
        .updateOne(
          {_id: new mongoose.Types.ObjectId(branchId)},
          {$set: {previousDisbursement: 170000}}
        );
    }
    
    // If branch doesn't have previousDisbursementRollNo set, set it to 2 (baseline from PRD)  
    if (!branch?.previousDisbursementRollNo) {
      console.log('Setting branch previousDisbursementRollNo to 2 (baseline)');
      await mongoose.connection.db
        .collection('branches')
        .updateOne(
          {_id: new mongoose.Types.ObjectId(branchId)},
          {$set: {previousDisbursementRollNo: 2}}
        );
    }
    
    // Get all disbursement rolls for this branch
    const disbursementRolls = await mongoose.connection.db
      .collection('disbursementrolls')
      .find({branch: new mongoose.Types.ObjectId(branchId)})
      .sort({date: 1})
      .toArray();
      
    console.log(`\\nFound ${disbursementRolls.length} disbursement roll records to migrate`);
    
    for (const roll of disbursementRolls) {
      const rollDate = new Date(roll.date);
      const updates = {};
      let needsUpdate = false;
      
      // Add missing previousDisbursement field
      if (!roll.previousDisbursement) {
        updates.previousDisbursement = branch?.previousDisbursement || 170000;
        needsUpdate = true;
      }
      
      // Add missing previousDisbursementRollNo field
      if (!roll.previousDisbursementRollNo) {
        updates.previousDisbursementRollNo = branch?.previousDisbursementRollNo || 2;
        needsUpdate = true;
      }
      
      // Add missing dailyDisbursement field
      // We need to get this from the cashbook2 data for this date
      if (roll.dailyDisbursement === undefined) {
        const cashbook = await mongoose.connection.db
          .collection('cashbook2s')
          .findOne({
            branch: new mongoose.Types.ObjectId(branchId),
            date: {
              $gte: new Date(rollDate.getFullYear(), rollDate.getMonth(), rollDate.getDate()),
              $lt: new Date(rollDate.getFullYear(), rollDate.getMonth(), rollDate.getDate() + 1)
            }
          });
          
        updates.dailyDisbursement = cashbook?.disAmt || 0;
        needsUpdate = true;
        console.log(`  Setting dailyDisbursement to ${updates.dailyDisbursement} for ${rollDate.toDateString()}`);
      }
      
      if (needsUpdate) {
        await mongoose.connection.db
          .collection('disbursementrolls')
          .updateOne({_id: roll._id}, {$set: updates});
        console.log(`  Updated disbursement roll for ${rollDate.toDateString()}`);
      }
    }
    
    // Now recalculate all disbursement rolls using the new logic
    console.log('\\n=== RECALCULATING ALL DISBURSEMENT ROLLS ===');
    
    // Use the DisbursementRoll model to ensure we use the updated schema and methods
    const DisbursementRollSchema = new mongoose.Schema({
      branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
      date: { type: Date, required: true, default: Date.now },
      previousDisbursement: { type: Number, default: 0 },
      previousDisbursementRollNo: { type: Number, default: 0 },
      dailyDisbursement: { type: Number, default: 0 },
      currentDayDisbursementRollNo: { type: Number, default: 0 },
      disbursementRoll: { type: Number, default: 0 },
      disNo: { type: Number, default: 0 },
    }, { timestamps: true });
    
    // Add the calculation method
    DisbursementRollSchema.methods.calculateCumulativeDisbursement = async function() {
      const DisbursementRoll = this.constructor;
      
      const previousRolls = await DisbursementRoll.find({
        branch: this.branch,
        date: { $lt: this.date }
      }).sort({ date: 1 });

      const allPreviousDayAmounts = previousRolls.reduce((sum, roll) => {
        return sum + (roll.dailyDisbursement || 0);
      }, 0);

      const allPreviousDayNumbers = previousRolls.reduce((sum, roll) => {
        return sum + (roll.currentDayDisbursementRollNo || 0);
      }, 0);

      this.disbursementRoll = (this.previousDisbursement || 0) + allPreviousDayAmounts + (this.dailyDisbursement || 0);
      this.disNo = (this.previousDisbursementRollNo || 0) + allPreviousDayNumbers + (this.currentDayDisbursementRollNo || 0);
    };
    
    const DisbursementRoll = mongoose.model('DisbursementRoll', DisbursementRollSchema);
    
    // Get all rolls again and recalculate them in order
    const rollsToRecalculate = await DisbursementRoll.find({
      branch: new mongoose.Types.ObjectId(branchId)
    }).sort({ date: 1 });
    
    for (const roll of rollsToRecalculate) {
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
      
      console.log(`Recalculated ${roll.date.toDateString()}: disbursementRoll ${oldDisbursementRoll} → ${roll.disbursementRoll}, disNo ${oldDisNo} → ${roll.disNo}`);
    }
    
    console.log('\\n✅ Migration completed successfully!');
    console.log('\\nRun test-disbursement-fix.js to verify the results.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateDisbursementRollFields();