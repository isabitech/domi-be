export default async function(mongoose) {
  // Ensure critical compound indexes (idempotent)
  const db = mongoose.connection;
  await db.collection('dailyoperations').createIndex({ branch: 1, date: -1 });
  await db.collection('dailyoperations').createIndex({ user: 1, date: -1 });
  await db.collection('disbursementrolls').createIndex({ branch: 1, year: -1, month: -1 });
  await db.collection('loanregisters').createIndex({ branch: 1, date: -1 });
  await db.collection('savingsregisters').createIndex({ branch: 1, date: -1 });
  await db.collection('cashbook1s').createIndex({ branch: 1, date: -1 });
  await db.collection('cashbook2s').createIndex({ branch: 1, date: -1 });
  await db.collection('bankstatement1s').createIndex({ branch: 1, date: -1 });
  await db.collection('bankstatement2s').createIndex({ branch: 1, date: -1 });
  await db.collection('predictions').createIndex({ branch: 1, predictionDate: -1 });
  console.log('Indexes ensured');
}
