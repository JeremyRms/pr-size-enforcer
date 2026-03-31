import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

function generateSignature(payload) {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
        throw new Error('WEBHOOK_SECRET is not set');
    }
    return `sha256=${crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')}`;
}

export { generateSignature };
