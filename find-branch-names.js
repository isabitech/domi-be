require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

async function findAndCheckBranches() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('=== SEARCHING FOR BRANCH NAMES ===\n');
    
    const searchTerms = ['Peace', 'Greatness', 'Breakthrough', 'Mandate'];
    
    for (const term of searchTerms) {
      console.log(`🔍 Searching for branches containing "${term}":`);
      
      const branches = await mongoose.connection.db.collection('branches')
        .find({ branchName: { $regex: new RegExp(term, 'i') } })
        .toArray();
      
      if (branches.length > 0) {
        branches.forEach(branch => {
          console.log(`   ✅ ${branch.branchName} (ID: ${branch._id})`);
        });
      } else {
        console.log(`   ❌ No branches found containing "${term}"`);
      }
      console.log('');
    }
    
    console.log('\n=== ALL BRANCH NAMES (for reference) ===');
    const allBranches = await mongoose.connection.db.collection('branches')
      .find({}, { projection: { branchName: 1 } })
      .sort({ branchName: 1 })
      .toArray();
    
    allBranches.forEach((branch, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${branch.branchName}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\nDisconnected from MongoDB');
    mongoose.disconnect();
  }
}

findAndCheckBranches();