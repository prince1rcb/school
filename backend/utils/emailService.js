const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Email could not be sent');
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const message = `
    <h2>Welcome to EMRS Dornala!</h2>
    <p>Dear ${user.firstName} ${user.lastName},</p>
    <p>Your account has been successfully created.</p>
    <p><strong>Your Login Details:</strong></p>
    <ul>
      <li>Email: ${user.email}</li>
      <li>Role: ${user.role}</li>
      ${user.studentId ? `<li>Student ID: ${user.studentId}</li>` : ''}
      ${user.employeeId ? `<li>Employee ID: ${user.employeeId}</li>` : ''}
    </ul>
    <p>Please login to access your dashboard.</p>
    <p>Best regards,<br>EMRS Dornala Team</p>
  `;

  await sendEmail({
    email: user.email,
    subject: 'Welcome to EMRS Dornala - Account Created',
    html: message,
  });
};

// Send notification email
const sendNotificationEmail = async (user, subject, message) => {
  const htmlMessage = `
    <h2>${subject}</h2>
    <p>Dear ${user.firstName} ${user.lastName},</p>
    <div>${message}</div>
    <p>Best regards,<br>EMRS Dornala Team</p>
  `;

  await sendEmail({
    email: user.email,
    subject: `${subject} - EMRS Dornala`,
    html: htmlMessage,
  });
};

// Send result notification
const sendResultNotification = async (student, result) => {
  const message = `
    <h2>Exam Result Published</h2>
    <p>Dear ${student.firstName} ${student.lastName},</p>
    <p>Your result for <strong>${result.examName}</strong> has been published.</p>
    <p><strong>Result Summary:</strong></p>
    <ul>
      <li>Total Marks: ${result.totalMarks}/${result.maxTotalMarks}</li>
      <li>Percentage: ${result.percentage}%</li>
      <li>Grade: ${result.overallGrade}</li>
      <li>Rank: ${result.rank}/${result.totalStudents}</li>
    </ul>
    <p>Please login to view your detailed result.</p>
    <p>Best regards,<br>EMRS Dornala Team</p>
  `;

  await sendEmail({
    email: student.email,
    subject: 'Exam Result Published - EMRS Dornala',
    html: message,
  });
};

// Send announcement email
const sendAnnouncementEmail = async (user, announcement) => {
  const message = `
    <h2>${announcement.title}</h2>
    <p>Dear ${user.firstName} ${user.lastName},</p>
    <div>${announcement.content}</div>
    <p><strong>Category:</strong> ${announcement.category}</p>
    <p><strong>Priority:</strong> ${announcement.priority}</p>
    <p>Please login to view more details.</p>
    <p>Best regards,<br>EMRS Dornala Team</p>
  `;

  await sendEmail({
    email: user.email,
    subject: `${announcement.title} - EMRS Dornala`,
    html: message,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  sendResultNotification,
  sendAnnouncementEmail,
};