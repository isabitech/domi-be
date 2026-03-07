require('dotenv').config();
const mongoose = require('./server/src/config/db');

async function checkBranches() {
  try {
    console.log('Connected to MongoDB');
    const Branch = require('./server/src/models/Branch');
    
    console.log('📋 All branches in database:');
    const branches = await Branch.find({}, 'branchName').sort({ branchName: 1 });
    branches.forEach((branch, index) => {
      console.log(`${index + 1}. ${branch.branchName}`);
    });
    
    console.log('\n🔍 Searching for branches containing "christ" or "light":');
    const christBranches = await Branch.find({
      branchName: { $regex: /christ|light/i }
    }, 'branchName').sort({ branchName: 1 });
    
    if (christBranches.length > 0) {
      christBranches.forEach(branch => {
        console.log(`✓ ${branch.branchName}`);
      });
    } else {
      console.log('❌ No branches found containing "christ" or "light"');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    console.log('Disconnected from MongoDB');
    mongoose.disconnect();
  }
}

checkBranches();