import sendEmail from '../utils/sendEmail.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';

class NotificationService {
  // Send EFCC update notification to HO users and global email
  static async sendEFCCUpdateNotification(efccRecord, updatedBy) {
    try {
      // Get all HO users
      const hoUsers = await User.find({ role: 'HO' }, 'email name username');
      
      // Get branch information
      const branch = await Branch.findById(efccRecord.branch, 'name code');
      
      // Get user who made the update
      const user = await User.findById(updatedBy, 'username name email');
      
      const branchName = branch ? `${branch.name} (${branch.code})` : 'Unknown Branch';
      const updatedByName = user ? `${user.name || user.username}` : 'Unknown User';
      
      // Format currency amounts
      const formatCurrency = (amount) => `₦${Number(amount).toLocaleString()}`;
      
      // Email content
      const subject = `EFCC Update Alert: ${branchName}`;
      const currentDate = new Date().toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>EFCC Update Notification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .alert-badge { background-color: #e74c3c; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .info-table th, .info-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .info-table th { background-color: #f8f9fa; font-weight: bold; width: 40%; }
            .amount { font-weight: bold; color: #27ae60; }
            .negative { color: #e74c3c; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .btn { background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🚨 EFCC Update Notification</h2>
              <span class="alert-badge">FINANCIAL COMPLIANCE UPDATE</span>
            </div>
            
            <div class="content">
              <p><strong>Dear Head Office Team,</strong></p>
              
              <p>A branch has updated their Expected Financial Compliance Calculation (EFCC) record. Please review the details below:</p>
              
              <table class="info-table">
                <tr>
                  <th>📍 Branch</th>
                  <td><strong>${branchName}</strong></td>
                </tr>
                <tr>
                  <th>👤 Updated By</th>
                  <td>${updatedByName}</td>
                </tr>
                <tr>
                  <th>📅 Update Date</th>
                  <td>${currentDate}</td>
                </tr>
                <tr>
                  <th>💰 Previous Amount Owing</th>
                  <td class="amount">${formatCurrency(efccRecord.previousAmountOwing)}</td>
                </tr>
                <tr>
                  <th>📈 Today's Remittance</th>
                  <td class="amount">${formatCurrency(efccRecord.todayRemittance)}</td>
                </tr>
                <tr>
                  <th>💸 Amount Remitting Now</th>
                  <td class="amount negative">${formatCurrency(efccRecord.amtRemittingNow)}</td>
                </tr>
                <tr>
                  <th>🎯 Current Amount Owing</th>
                  <td class="amount" style="font-size: 18px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                    <strong>${formatCurrency(efccRecord.currentAmountOwing)}</strong>
                  </td>
                </tr>
                <tr>
                  <th>📋 Submission Status</th>
                  <td>
                    ${efccRecord.isSubmitted 
                      ? '✅ <span style="color: #27ae60;">Submitted</span>' 
                      : '⏳ <span style="color: #f39c12;">Draft</span>'}
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>📊 Calculation Breakdown:</strong><br>
                Current Amount Owing = Previous Amount Owing + Today's Remittance - Amount Remitting Now<br>
                <strong>${formatCurrency(efccRecord.currentAmountOwing)} = ${formatCurrency(efccRecord.previousAmountOwing)} + ${formatCurrency(efccRecord.todayRemittance)} - ${formatCurrency(efccRecord.amtRemittingNow)}</strong>
              </div>
              
              <p style="margin-top: 30px;">
                <strong>Next Steps:</strong>
              </p>
              <ul>
                <li>Review the updated financial compliance data</li>
                <li>Verify the remittance amounts with branch records</li>
                <li>Follow up on any discrepancies if necessary</li>
                <li>Monitor branch compliance status</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" class="btn">
                  📊 View Dashboard
                </a>
              </div>
              
              <p><em>This is an automated notification from the Dominion Operations Management System.</em></p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Dominion Seedstars Nig LTD | Operations Management System</p>
              <p>This email was sent to all Head Office users and management.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
EFCC UPDATE NOTIFICATION

Branch: ${branchName}
Updated By: ${updatedByName}
Update Date: ${currentDate}

Financial Details:
- Previous Amount Owing: ${formatCurrency(efccRecord.previousAmountOwing)}
- Today's Remittance: ${formatCurrency(efccRecord.todayRemittance)}
- Amount Remitting Now: ${formatCurrency(efccRecord.amtRemittingNow)}
- Current Amount Owing: ${formatCurrency(efccRecord.currentAmountOwing)}
- Status: ${efccRecord.isSubmitted ? 'Submitted' : 'Draft'}

Calculation: ${formatCurrency(efccRecord.currentAmountOwing)} = ${formatCurrency(efccRecord.previousAmountOwing)} + ${formatCurrency(efccRecord.todayRemittance)} - ${formatCurrency(efccRecord.amtRemittingNow)}

Please review this update in the dashboard.
`;

      // Email recipients
      const recipients = [
        'dominionglobal2024@gmail.com', // Global management email
        ...hoUsers.map(user => user.email).filter(email => email) // All HO users
      ];

      // Remove duplicates
      const uniqueRecipients = [...new Set(recipients)];

      // Send emails to all recipients
      const emailPromises = uniqueRecipients.map(async (email) => {
        try {
          await sendEmail({
            email: email,
            subject: subject,
            html: htmlContent,
            message: textContent
          });
          console.log(`EFCC notification sent to: ${email}`);
          return { email, success: true };
        } catch (error) {
          console.error(`Failed to send EFCC notification to ${email}:`, error);
          return { email, success: false, error: error.message };
        }
      });

      const results = await Promise.allSettled(emailPromises);
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failureCount = results.length - successCount;

      console.log(`EFCC notification summary: ${successCount} sent, ${failureCount} failed`);
      
      return {
        success: true,
        sentTo: uniqueRecipients,
        successCount,
        failureCount,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
      };

    } catch (error) {
      console.error('Error sending EFCC update notification:', error);
      throw error;
    }
  }
  
  // Send EFCC submission notification
  static async sendEFCCSubmissionNotification(efccRecord, submittedBy) {
    try {
      // Get all HO users
      const hoUsers = await User.find({ role: 'HO' }, 'email name username');
      
      // Get branch information
      const branch = await Branch.findById(efccRecord.branch, 'name code');
      
      // Get user who submitted
      const user = await User.findById(submittedBy, 'username name email');
      
      const branchName = branch ? `${branch.name} (${branch.code})` : 'Unknown Branch';
      const submittedByName = user ? `${user.name || user.username}` : 'Unknown User';
      
      // Format currency amounts
      const formatCurrency = (amount) => `₦${Number(amount).toLocaleString()}`;
      
      const subject = `EFCC Submission: ${branchName} - ${new Date().toLocaleDateString()}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 8px;">
              <h2>✅ EFCC Record Submitted</h2>
              <p>Financial compliance record has been officially submitted</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-top: 20px;">
              <h3>Submission Details:</h3>
              <p><strong>Branch:</strong> ${branchName}</p>
              <p><strong>Submitted By:</strong> ${submittedByName}</p>
              <p><strong>Submission Time:</strong> ${efccRecord.submittedAt?.toLocaleString() || 'Just now'}</p>
              <p><strong>Current Amount Owing:</strong> <span style="font-size: 18px; color: #27ae60; font-weight: bold;">${formatCurrency(efccRecord.currentAmountOwing)}</span></p>
              
              <p style="margin-top: 20px; padding: 15px; background-color: #d4edda; border-left: 4px solid #27ae60; border-radius: 4px;">
                <strong>Status:</strong> This EFCC record has been officially submitted and is now final for today.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send to global management email and HO users
      const recipients = [
        'dominionglobal2024@gmail.com',
        ...hoUsers.map(user => user.email).filter(email => email)
      ];

      const uniqueRecipients = [...new Set(recipients)];

      for (const email of uniqueRecipients) {
        await sendEmail({
          email: email,
          subject: subject,
          html: htmlContent,
          message: `EFCC Record Submitted\n\nBranch: ${branchName}\nSubmitted By: ${submittedByName}\nCurrent Amount Owing: ${formatCurrency(efccRecord.currentAmountOwing)}`
        });
      }

      return { success: true, sentTo: uniqueRecipients };
    } catch (error) {
      console.error('Error sending EFCC submission notification:', error);
      throw error;
    }
  }
}

export default NotificationService;