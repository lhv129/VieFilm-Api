import nodemailer from 'nodemailer';
import { env } from '@/config/environment'; // Giả sử bạn có file cấu hình

const transporter = nodemailer.createTransport({
    service: env.EMAIL_SERVICE, // Ví dụ: 'Gmail'
    auth: {
        user: env.EMAIL_USERNAME,
        pass: env.EMAIL_PASSWORD,
    },
});

export const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: env.EMAIL_USERNAME,
        to,
        subject,
        html,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};