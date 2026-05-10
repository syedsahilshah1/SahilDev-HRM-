/**
 * Email Service for Software House System
 * Handles sending generated documents via Email.
 * 
 * To use a real SMTP server via EmailJS:
 * 1. Sign up at https://www.emailjs.com/
 * 2. Add your Service ID, Template ID, and Public Key to .env
 */

import emailjs from '@emailjs/browser';

export const sendDocumentEmail = async (emailData, config = {}) => {
  const { 
    to_name, 
    to_email, 
    template_name, 
    message_content,
    sent_by 
  } = emailData;

  const SERVICE_ID = config.serviceId || import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_sim';
  const TEMPLATE_ID = config.templateId || import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_sim';
  const PUBLIC_KEY = config.publicKey || import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key_sim';

  // If keys are not set, we simulate the send for development
  if (SERVICE_ID === 'service_sim') {
    console.log("%c[SMTP SIMULATION]", "color: #4CAF50; font-weight: bold; font-size: 1.2em;");
    console.log(`Sending to: ${to_email}`);
    console.log(`Subject: ${template_name}`);
    console.log(`Content:`, message_content);
    
    // Simulate network delay
    return new Promise((resolve) => setTimeout(() => resolve({ status: 200, text: 'OK' }), 1500));
  }

  try {
    const templateParams = {
      to_name: to_name,
      to_email: to_email,
      from_name: sent_by || 'HR Department',
      subject: template_name,
      message: message_content,
    };

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    return response;
  } catch (error) {
    console.error('Email Send Error:', error);
    throw error;
  }
};
