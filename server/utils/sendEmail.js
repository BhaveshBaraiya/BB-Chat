import axios from "axios";

export const sendVerificationEmail = async (email, otp) => {
    try {        
        const expireTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Asia/Kolkata' 
        });

        const payload = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY,
            template_params: {
                to_email: email,    
                passcode: otp,
                time: expireTime
            }
        };

        await axios.post("https://api.emailjs.com/api/v1.0/email/send", payload, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log(`Email sent successfully to ${email} via EmailJS!`);
    } catch (error) {
        console.error("CRITICAL EMAIL ERROR:", error.response?.data || error.message);
        throw new Error("Could not send verification email");
    }
};