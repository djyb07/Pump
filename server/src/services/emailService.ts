import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter (will be null if email is not configured)
let transporter: nodemailer.Transporter | null = null;

// Only create transporter if email credentials are provided
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    console.log('✅ Email service configured and ready');
} else {
    console.log('⚠️  Email service not configured - reset links will be logged to console');
}

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    // If email is not configured, just log the reset URL
    if (!transporter) {
        console.log('\n========================================');
        console.log('📧 PASSWORD RESET REQUEST');
        console.log('========================================');
        console.log(`Email: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('========================================\n');
        return;
    }

    // Email is configured - send actual email
    const mailOptions = {
        from: `"PUMP Fitness" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request - PUMP',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏋️ PUMP</h1>
                        <p>Password Reset Request</p>
                    </div>
                    <div class="content">
                        <h2>Hi there!</h2>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <center>
                            <a href="${resetUrl}" class="button">Reset Password</a>
                        </center>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">
                            ${resetUrl}
                        </p>
                        <p><strong>This link will expire in 1 hour.</strong></p>
                        <p>If you didn't request a password reset, you can safely ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 PUMP Fitness Tracker. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
Hi there!

We received a request to reset your password for your PUMP account.

Click the following link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

- PUMP Fitness Team
        `.trim()
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
        console.error('❌ Error sending email:', error);
        // Fallback to console logging if email fails
        console.log('\n========================================');
        console.log('📧 PASSWORD RESET REQUEST (Email failed - using fallback)');
        console.log('========================================');
        console.log(`Email: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('========================================\n');
    }
};
