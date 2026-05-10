import emailjs from '@emailjs/browser';

/**
 * SMTP Configuration from .env
 */
const SMTP_CONFIG = {
  Host: import.meta.env.VITE_SMTP_HOST || "smtp.gmail.com",
  Username: import.meta.env.VITE_SMTP_USER,
  Password: import.meta.env.VITE_SMTP_PASS,
};

const SUPERADMIN_EMAIL = import.meta.env.VITE_SUPERADMIN_EMAIL;

// Debug log for environment status (only log presence, not values)
console.log("[EmailService] Initialized. SMTP configured:", !!SMTP_CONFIG.Username, "| EmailJS configured:", !!import.meta.env.VITE_EMAILJS_SERVICE_ID);

// Internal implementation of SmtpJS to avoid CDN loading issues/blocks
const sendSmtpRequest = async (config) => {
  const payload = {
    ...config,
    Action: "Send",
    nocache: Math.floor(1e6 * Math.random() + 1)
  };

  const response = await fetch("https://smtpjs.com/v3/smtpjs.aspx?", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  return await response.text();
};

// Generic helper for sending emails via SmtpJS (Primary) or EmailJS (Fallback)
const sendEmail = async (subject, body, toEmail, templateId = null, templateParams = {}) => {
  const { Username, Password, Host } = SMTP_CONFIG;

  // 1. Try SmtpJS logic first if credentials are provided
  if (Username && Password) {
    try {
      console.log(`[SMTP] Attempting to send email via ${Host} to: ${toEmail}`);
      
      const result = await sendSmtpRequest({
        Host: Host,
        Username: Username,
        Password: Password,
        To: toEmail,
        From: Username,
        Subject: subject,
        Body: body,
      });

      console.log(`[SMTP] Response from server: ${result}`);
      
      if (result === "OK") {
        return { status: 200, text: 'OK' };
      } else {
        if (result.includes("Authentication failed")) {
          throw new Error("SMTP Auth Failed. Check Gmail App Password.");
        }
        throw new Error(`SMTP Error: ${result}`);
      }
    } catch (smtpErr) {
      console.warn("[SMTP] Failed to send or fetch. Trying fallback...", smtpErr.message);
      // Don't throw yet, continue to EmailJS
    }
  }

  // 2. Try EmailJS
  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const TID = templateId || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  if (SERVICE_ID && PUBLIC_KEY && TID) {
    try {
      console.log(`[EmailJS] Attempting send via template: ${TID}`);
      const params = {
        ...templateParams,
        to_email: toEmail,
        subject: subject,
        message: body,
      };
      return await emailjs.send(SERVICE_ID, TID, params, PUBLIC_KEY);
    } catch (err) {
      console.error('EmailJS Error:', err);
      // If we also fail here, we move to simulation
    }
  }

  // 3. Last Resort: Simulation (So the app doesn't break for the user)
  console.log("%c[EMAIL SIMULATION MODE]", "color: #ff9800; font-weight: bold;");
  console.log(`To: ${toEmail}\nSubject: ${subject}\nBody: ${body}`);
  
  // In development, we can return success so the user can still test the app
  if (import.meta.env.DEV) {
    console.warn("Emails are currently being SIMULATED. Check console logs.");
    return { status: 200, text: 'SIMULATED_OK' };
  }
  
  throw new Error("All email services failed. Check network and configuration.");
};



export const sendDocumentEmail = async (emailData) => {
  const subject = `[SahilDev HRM] ${emailData.template_name}`;
  const body = `
    <h3>Document Shared: ${emailData.template_name}</h3>
    <p><strong>From:</strong> ${emailData.sent_by || 'SahilDev HR'}</p>
    <hr/>
    <div>${emailData.message_content}</div>
  `;
  
  const templateParams = {
    to_name: emailData.to_name,
    to_email: emailData.to_email,
    from_name: emailData.sent_by || 'SahilDev HR',
    subject: emailData.template_name,
    message: emailData.message_content,
  };
  
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  return sendEmail(subject, body, emailData.to_email, TEMPLATE_ID, templateParams);
};

export const sendTaskAssignmentEmail = async (taskData) => {
  const subject = `New Task Assigned: ${taskData.title}`;
  const body = `
    <h2>Task Assignment Notification</h2>
    <p>Hello ${taskData.assignedToName},</p>
    <p>You have been assigned a new task: <strong>${taskData.title}</strong></p>
    <ul>
      <li><strong>Priority:</strong> ${taskData.priority}</li>
      <li><strong>Due Date:</strong> ${taskData.dueDate}</li>
      <li><strong>Assigned By:</strong> ${taskData.createdBy}</li>
    </ul>
    <p>Please log in to your dashboard to view more details.</p>
  `;

  const templateParams = {
    to_name: taskData.assignedToName,
    to_email: taskData.assignedToEmail,
    task_title: taskData.title,
    task_priority: taskData.priority,
    due_date: taskData.dueDate,
    assigned_by: taskData.createdBy,
  };

  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TASK_TEMPLATE_ID;
  return sendEmail(subject, body, taskData.assignedToEmail, TEMPLATE_ID, templateParams);
};

export const sendOTPEmail = async (email, otp) => {
  const subject = `Your Verification Code: ${otp}`;
  const body = `
    <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center;">SahilDev HRM</h2>
      <p>Hello,</p>
      <p>Use the following code to complete your login:</p>
      <div style="background: #f8fafc; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  `;

  const templateParams = {
    to_email: email,
    otp_code: otp,
  };

  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID;
  return sendEmail(subject, body, email, TEMPLATE_ID, templateParams);
};
