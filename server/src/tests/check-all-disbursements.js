import mongoose from 'mongoose';

async function checkAllDisbursements() {
  try {
    // Connect to the main database (uses MONGO_URI or falls back to provided URI)
    await mongoose.connect(
      process.env.MONGO_URI ||
        'mongodb+srv://isabitechng_db_user:domi_seedstars_ng@cluster0.rf2jlcm.mongodb.net/?appName=Cluster0'
    );

    const branchId = '692ef31ad6ea4db16c55d7f0';

    console.log('=== CHECKING ALL DISBURSEMENT-RELATED RECORDS ===');

    // Check all disbursement rolls for this branch
    console.log('\n1. ALL DISBURSEMENT ROLLS:');
    const allDisbursementRolls = await mongoose.connection.db
      .collection('disbursementrolls')
      .find({ branch: new mongoose.Types.ObjectId(branchId) })
      .sort({ date: 1 })
      .toArray();

    console.log(`Found ${allDisbursementRolls.length} disbursement roll records`);
    let totalDailyDisbursementFromRolls = 0;
    allDisbursementRolls.forEach((roll, i) => {
      const prevDisb = roll.previousDisbursement || 0;
      const dailyDisb = roll.dailyDisbursement || 0;
      const totalForRecord = prevDisb + dailyDisb;
      totalDailyDisbursementFromRolls += dailyDisb;
      console.log(
        `${i + 1}. date: ${roll.date}, previousDisbursement: ${prevDisb}, dailyDisbursement: ${dailyDisb}, ` +
          `previous+daily for this record: ${totalForRecord}`
      );
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
      .sort({ date: 1 })
      .toArray();

    console.log(`Found ${cashbookDisbursements.length} cashbook disbursement records`);

    // Group and log by day
    const perDayMap = new Map();
    let totalCashbookDis = 0;
    cashbookDisbursements.forEach((cb, i) => {
      const dateKey = new Date(cb.date).toISOString().split('T')[0];
      const disAmt = cb.disAmt || 0;
      const disNo = cb.disNo || 0;
      totalCashbookDis += disAmt;

      if (!perDayMap.has(dateKey)) {
        perDayMap.set(dateKey, { totalDisAmt: 0, totalDisNo: 0, count: 0 });
      }
      const entry = perDayMap.get(dateKey);
      entry.totalDisAmt += disAmt;
      entry.totalDisNo += disNo;
      entry.count += 1;

      console.log(`${i + 1}. Date: ${cb.date}, disAmt: ${cb.disAmt}, disNo: ${cb.disNo}`);
    });

    console.log('\nPer-day disbursement summary (for this branch):');
    Array.from(perDayMap.entries())
      .sort(([d1], [d2]) => (d1 < d2 ? -1 : d1 > d2 ? 1 : 0))
      .forEach(([dateKey, entry]) => {
        console.log(
          `  ${dateKey} -> totalDisAmt: ${entry.totalDisAmt}, totalDisNo: ${entry.totalDisNo}, records: ${entry.count}`
        );
      });

    console.log(`\nTotal cashbook disbursements (amount): ${totalCashbookDis}`);

    // Check branch baseline
    console.log('\n3. BRANCH BASELINE:');
    const branch = await mongoose.connection.db
      .collection('branches')
      .findOne({ _id: new mongoose.Types.ObjectId(branchId) });

    if (branch) {
      console.log(`Branch previousDisbursement (amount baseline): ${branch.previousDisbursement}`);
      console.log(`Branch previousDisbursementRollNo (roll baseline): ${branch.previousDisbursementRollNo}`);
    }

    console.log('\n=== ANALYSIS (FORMULAS) ===');
    const prevDisbursement = branch?.previousDisbursement || 0;
    const prevDisbursementRollNo = branch?.previousDisbursementRollNo || 0;

    // Amount-side formula (using dailyDisbursement from all roll records):
    // currentDisbursement = prevDisbursement + sum of all dailyDisbursement
    const expectedCurrentDisbursement = prevDisbursement + totalDailyDisbursementFromRolls;
    console.log(
      `Amount side => currentDisbursement = prevDisbursement (${prevDisbursement}) + allDaysDisbursements (${totalDailyDisbursementFromRolls}) = ${expectedCurrentDisbursement}`
    );

    // Roll-number side formula (using disNo from cashbook):
    const totalCashbookDisNo = cashbookDisbursements.reduce((sum, cb) => sum + (cb.disNo || 0), 0);
    console.log(`Total cashbook disbursement numbers (disNo): ${totalCashbookDisNo}`);
    const expectedDisbursementRollNo = prevDisbursementRollNo + totalCashbookDisNo;
    console.log(
      `Roll side => disbursementRoll = prevDisbursementRollNo (${prevDisbursementRollNo}) + allDaysDisbursementRollNo (${totalCashbookDisNo}) = ${expectedDisbursementRollNo}`
    );

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the mongoose connection cleanly
    await mongoose.disconnect();
  }
}

checkAllDisbursements();