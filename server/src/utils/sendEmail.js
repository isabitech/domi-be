import brevo from '@getbrevo/brevo';

const sendEmail = async (options) => {
  try {
    // Initialize Brevo API client
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    // Configure email
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html || `<p>${options.message}</p>`;
    sendSmtpEmail.textContent = options.message;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || process.env.FROM_NAME || 'Domi Seedstars Nig Ltd',
      email: process.env.BREVO_SENDER_EMAIL || process.env.FROM_EMAIL || 'isabitechng@gmail.com'
    };
    sendSmtpEmail.to = [{
      email: options.email,
      name: options.name || 'User'
    }];

    // Send email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully via Brevo API:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Brevo email sending failed:', error);
    throw error;
  }
};

export default sendEmail;