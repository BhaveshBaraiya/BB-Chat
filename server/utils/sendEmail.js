import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            // Explicitly define the Gmail SMTP host instead of the 'service' shorthand
            host: 'smtp.gmail.com',
            port: 465, // Use 465 for secure TLS
            secure: true, 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            // THE MAGIC LINE: Force Node.js to use IPv4. This fixes the Render ENETUNREACH error.
            family: 4 
        });

        const mailOptions = {
            from: `"BBChat Security" <${process.env.EMAIL_USER}>`, 
            to: email,
            subject: "Verify Your Account - BBChat",
            text: `Welcome to BBChat! Your verification code is ${otp}. This code expires in 15 minutes.`,
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155;">
                
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <img src="https://bbchat-devscommunity.vercel.app/assets/logo.png" alt="BBChat Logo" style="height: 48px; width: auto; display: block; margin: 0 auto;" />
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 20px 40px 40px 40px; text-align: center;">
                            <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #0f172a;">Verify your email</h2>
                            <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 24px; color: #64748b;">
                                Thank you for signing up. To complete your registration and secure your account, please use the verification code below.
                            </p>
                            
                            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                                <h1 style="margin: 0; font-size: 42px; letter-spacing: 8px; color: #4f46e5; font-weight: 700;">${otp}</h1>
                            </div>
                            
                            <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                                This code will expire in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            
                            <div style="margin-bottom: 20px;">
                                <a href="https://www.linkedin.com/in/bhavesh-baraiya/" style="display: inline-block; margin: 0 10px; text-decoration: none;">
                                    <img src="https://img.icons8.com/ios-filled/50/94a3b8/linkedin.png" alt="LinkedIn" style="height: 24px; width: 24px;" />
                                </a>
                                <a href="https://bbchat-devscommunity.vercel.app/" style="display: inline-block; margin: 0 10px; text-decoration: none;">
                                    <img src="https://img.icons8.com/ios-filled/50/94a3b8/domain.png" alt="Website" style="height: 24px; width: 24px;" />
                                </a>
                            </div>

                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">
                                &copy; ${new Date().getFullYear()} BBChat. All rights reserved.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                Need help? <a href="mailto:bhavesh.baraiya.codes@gmail.com" style="color: #4f46e5; text-decoration: none;">Contact Support</a>
                            </p>
                        </td>
                    </tr>

                </table>
                
                <div style="height: 40px;"></div>
            </body>
            </html>
            `
        };

        await transporter.sendMail(mailOptions);
        
    } catch (error) {
        console.error("Email sending failed:", error);
        throw new Error("Could not send verification email");
    }
};