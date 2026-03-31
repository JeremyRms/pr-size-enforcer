import dotenv from 'dotenv';
import { generateSignature } from '../signature.js';

dotenv.config();

// Mock the environment variable for testing
process.env.WEBHOOK_SECRET = 'testsecret';

describe('generateSignature', () => {
    test('should generate a valid signature for a given payload', () => {
        const payload = 'test-payload';
        const signature = generateSignature(payload);
        expect(signature).toMatch(/^sha256=/);
    });

    test('should generate a different signature for a different payload', () => {
        const payload1 = 'test-payload-1';
        const payload2 = 'test-payload-2';
        const signature1 = generateSignature(payload1);
        const signature2 = generateSignature(payload2);
        expect(signature1).not.toEqual(signature2);
    });

    test('should throw an error if WEBHOOK_SECRET is not set', () => {
        delete process.env.WEBHOOK_SECRET;
        expect(() => generateSignature('test-payload')).toThrow('WEBHOOK_SECRET is not set');
    });
});
