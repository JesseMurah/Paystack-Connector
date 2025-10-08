export type StandardPayoutResponseDto = {
  success: boolean;
  message: string;
  data: {
    reference: string;
    provider_reference: string;
    amount: number;
    currency: string;
    status: string;
    recipient: {
      name: string;
      account_number: string;
      network?: string;
      bank_code?: string;
    };
    timestamp: string;
  };
}