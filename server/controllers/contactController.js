import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const ContactController = {
  async send(req, res) {
    const { name, email, message } = req.body || {};
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    const to = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
    try {
      await transporter.sendMail({
        from: `"Orbit Movie Contact" <${process.env.SMTP_USER}>`,
        to,
        replyTo: email.trim(),
        subject: `Contact Us: ${name.trim()}`,
        text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
        html: `<p><strong>Name:</strong> ${name.trim()}</p><p><strong>Email:</strong> ${email.trim()}</p><p>${message.trim().replace(/\n/g, '<br/>')}</p>`,
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Contact email error:', err);
      res.status(500).json({ error: 'Failed to send message.' });
    }
  },
};
