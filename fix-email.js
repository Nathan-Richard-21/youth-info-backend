const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, 'routes', 'auth.js');
let content = fs.readFileSync(authPath, 'utf8');

// Replace the emailjs.send call with nodemailer
const emailjsPattern = /const response = await emailjs\.send\([^}]+}\s*\);/s;
const nodemailerCode = `const info = await transporter.sendMail({
        from: `"MyYouthInfo" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request - Youth Portal',
        html: \`
          <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <div style="background: #667eea; color: white; padding: 30px; text-align: center;">
              <h1>🔐 Password Reset</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <p>Hi \${user.name},</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="\${resetUrl}" style="display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
              </p>
              <p>Or copy this link: <br>\${resetUrl}</p>
              <p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;">
                <strong>⏱️ This link expires in 1 hour.</strong>
              </p>
              <p>Best regards,<br><strong>Youth Portal Team</strong></p>
            </div>
          </div>
        \`
      });`;

content = content.replace(emailjsPattern, nodemailerCode);

// Replace response references
content = content.replace(/console\.log\('✅ EmailJS Response:', response\);/, "console.log('✅ Email sent! ID:', info.messageId);");

fs.writeFileSync(authPath, content, 'utf8');
console.log('✅ auth.js updated successfully!');
