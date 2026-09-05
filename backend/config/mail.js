import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        get user() {
            return process.env.EMAIL_USER;
        },
        get pass() {
            return process.env.EMAIL_PASS;
        }
    }
});

export default transporter; 