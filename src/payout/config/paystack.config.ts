import * as process from 'node:process';

export default () => ({
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    baseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  },
});