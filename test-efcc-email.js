const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function testEFCCEmailNotification() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const branchId = '692ef31ad6ea4db16c55d7f0';
    
    console.log('=== TESTING EFCC EMAIL NOTIFICATION ===\\n');
    
    // Import the NotificationService (dynamic import for ES modules)
    const { default: NotificationService } = await import('./server/src/services/NotificationService.js');
    
    // Create a mock EFCC record for testing
    const mockEFCCRecord = {
      branch: new mongoose.Types.ObjectId(branchId),
      date: new Date(),
      previousAmountOwing: 75000,
      todayRemittance: 25000,
      amtRemittingNow: 15000,
      currentAmountOwing: 85000, // 75000 + 25000 - 15000
      isSubmitted: false,
      submittedAt: null,
      submittedBy: null
    };
    
    // Mock user ID (you can replace with actual user ID)
    const mockUserId = new mongoose.Types.ObjectId();
    
    console.log('Sending EFCC update notification...');
    console.log('Mock EFCC Record:');
    console.log(`  Branch ID: ${mockEFCCRecord.branch}`);
    console.log(`  Previous Amount Owing: ₦${mockEFCCRecord.previousAmountOwing.toLocaleString()}`);
    console.log(`  Today's Remittance: ₦${mockEFCCRecord.todayRemittance.toLocaleString()}`);
    console.log(`  Amount Remitting Now: ₦${mockEFCCRecord.amtRemittingNow.toLocaleString()}`);
    console.log(`  Current Amount Owing: ₦${mockEFCCRecord.currentAmountOwing.toLocaleString()}`);
    console.log('\\nRecipients will be:');
    console.log('  - dominionglobal2024@gmail.com');
    console.log('  - All HO users in the database');
    
    // Test the email notification
    try {
      const result = await NotificationService.sendEFCCUpdateNotification(mockEFCCRecord, mockUserId);
      
      console.log('\\n✅ Email notification sent successfully!');
      console.log(`   Sent to ${result.successCount} recipients`);
      console.log(`   Failed: ${result.failureCount} recipients`);
      console.log(`   Recipients: ${result.sentTo.join(', ')}`);
      
    } catch (emailError) {
      console.error('\\n❌ Email notification failed:', emailError.message);
    }
    
    console.log('\\n=== EMAIL TEST COMPLETED ===');
    console.log('\\nNote: Check the recipients\\ inboxes (including spam/junk folders) to verify email receipt.');
    console.log('The email should contain:')
    console.log('  - Branch information');
    console.log('  - Financial details with proper formatting');
    console.log('  - Calculation breakdown');
    console.log('  - Professional HTML styling');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testEFCCEmailNotification();