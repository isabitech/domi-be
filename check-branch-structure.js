require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

async function checkBranchStructure() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const sampleBranches = await mongoose.connection.db.collection('branches')
      .find({}).limit(3).toArray();
    
    console.log('Sample branch documents:');
    sampleBranches.forEach((branch, i) => {
      console.log(`Branch ${i + 1}:`, JSON.stringify(branch, null, 2));
    });
    
    // Check field names
    if (sampleBranches.length > 0) {
      console.log('\nField names in first branch:');
      console.log(Object.keys(sampleBranches[0]));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    console.log('Disconnected from MongoDB');
    mongoose.disconnect();
  }
}

checkBranchStructure();