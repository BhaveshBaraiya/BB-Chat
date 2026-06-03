import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465, // MUST be 465 for Render
            secure: true, // MUST be true for port 465
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            family: 4 // Keeps IPv4 active to prevent Google blocking cloud IPs
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify Your Account",
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2>Welcome to the App!</h2>
                    <p>Your 6-digit verification code is:</p>
                    <h1 style="font-size: 40px; letter-spacing: 5px; color: #4f46e5;">${otp}</h1>
                    <p>This code will expire in 15 minutes.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("CRITICAL SMTP ERROR:", error);
        throw new Error("Could not send verification email");
    }
};