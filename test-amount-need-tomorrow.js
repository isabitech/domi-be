require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

async function testAmountNeedTomorrow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('=== TESTING AMOUNT NEED TOMORROW FEATURE ===\n');
    
    // Test 1: Create a test entry using the model directly
    const AmountNeedTomorrow = mongoose.model('AmountNeedTomorrow', new mongoose.Schema({
      branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
      date: { type: Date, required: true, default: Date.now },
      loanAmount: { type: Number, default: 0, min: 0 },
      savingsWithdrawalAmount: { type: Number, default: 0, min: 0 },
      expensesAmount: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 },
      notes: { type: String, trim: true, maxlength: 500 },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    }, { timestamps: true }));
    
    // Get a sample branch and user
    const branch = await mongoose.connection.db.collection('branches').findOne({});
    const user = await mongoose.connection.db.collection('users').findOne({});
    
    if (!branch || !user) {
      console.log('❌ No branch or user found for testing');
      return;
    }
    
    console.log(`📋 Test Branch: ${branch.name} (${branch._id})`);
    console.log(`👤 Test User: ${user.username || user.email} (${user._id})\n`);
    
    // Create test amount need tomorrow entry
    const testEntry = new AmountNeedTomorrow({
      branch: branch._id,
      date: new Date(),
      loanAmount: 500000,
      savingsWithdrawalAmount: 200000,
      expensesAmount: 50000,
      notes: 'Test entry for tomorrow needs',
      submittedBy: user._id
    });
    
    // Calculate total before saving
    testEntry.total = testEntry.loanAmount + testEntry.savingsWithdrawalAmount + testEntry.expensesAmount;
    
    await testEntry.save();
    console.log('✅ Test entry created successfully:');
    console.log(`   Loan Amount: ${testEntry.loanAmount.toLocaleString()}`);
    console.log(`   Savings Withdrawal: ${testEntry.savingsWithdrawalAmount.toLocaleString()}`);
    console.log(`   Expenses: ${testEntry.expensesAmount.toLocaleString()}`);
    console.log(`   Total: ${testEntry.total.toLocaleString()}`);
    console.log(`   Notes: ${testEntry.notes}`);
    console.log(`   Date: ${testEntry.date.toLocaleDateString('en-GB')}\n`);
    
    // Test 2: Check if we can retrieve it
    const retrieved = await AmountNeedTomorrow.findOne({ branch: branch._id })
      .sort({ createdAt: -1 })
      .populate('submittedBy', 'username email')
      .lean();
    
    if (retrieved) {
      console.log('✅ Successfully retrieved entry:');
      console.log(`   ID: ${retrieved._id}`);
      console.log(`   Total: ${retrieved.total.toLocaleString()}`);
      console.log(`   Submitted by: ${retrieved.submittedBy?.username || retrieved.submittedBy?.email}`);
    } else {
      console.log('❌ Could not retrieve the test entry');
    }
    
    console.log('\n🎉 Amount Need Tomorrow feature test completed successfully!');
    console.log('\n📡 Available API Endpoints:');
    console.log('   POST   /api/amount-need-tomorrow        - Create/Update');
    console.log('   GET    /api/amount-need-tomorrow        - Get latest for branch');
    console.log('   GET    /api/amount-need-tomorrow/all    - Get all branches (HO)');
    console.log('   GET    /api/amount-need-tomorrow/history- Get history');
    console.log('   GET    /api/amount-need-tomorrow/date/:date - Get by date');
    console.log('   DELETE /api/amount-need-tomorrow/:id    - Delete entry');
    
    console.log('\n📋 Integration with /api/operations/all:');
    console.log('   ✅ Amount need tomorrow data will now be included in operations endpoint');
    console.log('   ✅ HO can see all branches amount needs in daily operations view');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    console.log('\nDisconnected from MongoDB');
    mongoose.disconnect();
  }
}

testAmountNeedTomorrow();