import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            // 1. Remove `service: 'gmail'` and explicitly define the host
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            family: 4 
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify Your Account",
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; border:1px solid #000">
                    <h2>Welcome to the App!</h2>
                    <p>Your 6-digit verification code is:</p>
                    <h1 style="font-size: 40px; letter-spacing: 5px; color: #4f46e5;">${otp}</h1>
                    <p>This code will expire in 15 minutes.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Email sending failed:", error);
        throw new Error("Could not send verification email");
    }
};