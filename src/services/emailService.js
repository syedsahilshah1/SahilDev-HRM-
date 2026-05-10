import emailjs from '@emailjs/browser';

/**
 * EmailJS Configuration (Set these in .env)
 */
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

const SUPER_ADMIN_EMAIL = import.meta.env.VITE_USER_EMAIL;

// Debug log for environment status
console.log("[EmailService] Initialized with EmailJS.");
console.log("- SuperAdmin:", SUPER_ADMIN_EMAIL);

/**
 * Main function to send emails via EmailJS
 */
export const sendEmail = async (subject, body, toEmail, templateId = null, templateParams = {}) => {
  const { serviceId, publicKey } = EMAILJS_CONFIG;
  const tid = templateId || EMAILJS_CONFIG.templateId;

  if (serviceId && publicKey && tid) {
    try {
      console.log(`[EmailJS] Attempting to send email to: ${toEmail}`);
      
      const params = {
        ...templateParams,
        to_email: toEmail,
        subject: subject,
        message: body,
      };

      const result = await emailjs.send(serviceId, tid, params, publicKey);
      console.log("[EmailJS] Success!", result.text);
      return { status: 200, text: 'OK' };
    } catch (err) {
      console.error('[EmailJS] Failed:', err);
    }
  }

  // Backup Simulation
  console.warn("%c[EMAIL SIMULATION MODE] No EmailJS keys found.", "color: #ff9800; font-weight: bold;");
  console.log(`To: ${toEmail}\nSubject: ${subject}\nBody: ${body}`);
  return { status: 200, text: 'SIMULATED_OK' };
};

export const sendOTPEmail = async (email, otp) => {
  console.log("%c[OTP SERVICE] Your code is: " + otp, "background: #2563eb; color: white; padding: 5px; font-weight: bold; border-radius: 4px;");

  const subject = `Your Verification Code: ${otp}`;
  const body = `Verification Code: ${otp}. This code expires in 10 minutes.`;

  const templateParams = {
    to_email: email,
    otp_code: otp,
  };

  return sendEmail(subject, body, email, EMAILJS_CONFIG.templateId, templateParams);
};

export const sendDocumentEmail = async (emailData) => {
  const subject = `[SahilDev HRM] ${emailData.template_name}`;
  const body = emailData.message_content;
  
  const templateParams = {
    to_name: emailData.sent_by || 'SahilDev HR',
    to_email: emailData.to_email,
    message_content: emailData.message_content,
  };
  
  const TID = import.meta.env.VITE_EMAILJS_TASK_TEMPLATE_ID || EMAILJS_CONFIG.templateId;
  return sendEmail(subject, body, emailData.to_email, TID, templateParams);
};

export const sendTaskAssignmentEmail = async (taskData) => {
  const subject = `New Task Assigned: ${taskData.title}`;
  const body = `Task: ${taskData.title}\nPriority: ${taskData.priority}\nDue Date: ${taskData.dueDate}`;

  const templateParams = {
    to_name: taskData.assignedToName,
    to_email: taskData.assignedToEmail,
    task_title: taskData.title,
    task_priority: taskData.priority,
    due_date: taskData.dueDate,
    assigned_by: taskData.createdBy,
  };

  const TID = import.meta.env.VITE_EMAILJS_TASK_TEMPLATE_ID || EMAILJS_CONFIG.templateId;
  return sendEmail(subject, body, taskData.assignedToEmail, TID, templateParams);
};
