const { generateSignature } = require('../signature');
const dotenv = require('dotenv');
dotenv.config();

// Mock the environment variable for testing
process.env.WEBHOOK_SECRET = 'testsecret';

describe('generateSignature', () => {
    it('should generate a valid signature for a given payload', () => {
        const payload = 'test payload';
        const expectedSignature = 'sha256=c40173ae0165ea7c168b0e9a97219173ebf402ebda46b0cb56d336ca836b02ad';
        const signature = generateSignature(payload);
        expect(signature).toBe(expectedSignature);
    });

    it('should generate a different signature for a different payload', () => {
        const payload = 'different payload';
        const expectedSignature = 'sha256=f0d5e65835380cb92e8c1fa325d662b26eac0bfefcab270f3ff03863e97ad07f';
        const signature = generateSignature(payload);
        expect(signature).toBe(expectedSignature);
    });

    it('should throw an error if WEBHOOK_SECRET is not set', () => {
        delete process.env.WEBHOOK_SECRET;
        expect(() => generateSignature('test payload')).toThrow('WEBHOOK_SECRET is not set');
    });
}); 
