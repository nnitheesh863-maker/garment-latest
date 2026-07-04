const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === 'development') {
    transporter = {
      sendMail: async (options) => {
        console.log('--- DEV EMAIL ---');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body: ${options.html}`);
        console.log('--- END EMAIL ---');
        return { messageId: 'dev-' + Date.now() };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();
  return transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@garment.com',
    to,
    subject,
    html,
  });
}

async function sendPasswordReset(email, token) {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${token}`;
  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p>`,
  });
}

async function sendTaskAssignment(employee, task) {
  return sendEmail({
    to: employee.email,
    subject: `New Task Assigned: ${task.title}`,
    html: `<h3>New Task Assignment</h3><p>Hi ${employee.profile?.firstName || 'Employee'},</p><p>You have been assigned a new task:</p><ul><li><strong>Task:</strong> ${task.title}</li><li><strong>Task #:</strong> ${task.taskNumber}</li><li><strong>Target:</strong> ${task.quantity?.target || 'N/A'}</li></ul>`,
  });
}

async function sendOrderUpdate(order, status) {
  return sendEmail({
    to: order.customer?.email,
    subject: `Order ${order.orderNumber} Status Update`,
    html: `<h3>Order Status Update</h3><p>Dear ${order.customer?.name || 'Customer'},</p><p>Your order <strong>${order.orderNumber}</strong> status has been updated to: <strong>${status}</strong>.</p>`,
  });
}

async function sendQualityAlert(managerEmail, inspection) {
  return sendEmail({
    to: managerEmail,
    subject: `Quality Alert - Inspection #${inspection.inspectionNumber}`,
    html: `<h3>Quality Alert</h3><p>Inspection #${inspection.inspectionNumber} for order ${inspection.orderId} has flagged defects.</p><p>Defect rate: ${(inspection.results?.defectRate || 0).toFixed(2)}%</p>`,
  });
}

module.exports = {
  sendEmail,
  sendPasswordReset,
  sendTaskAssignment,
  sendOrderUpdate,
  sendQualityAlert,
};
