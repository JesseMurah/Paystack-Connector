export class CreatePaystackRecipientInput  {
  type: string;
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

export class PaystackRecipientResponseDto  {
  status: boolean;
  message: string;
  data: {
    active: boolean;
    createdAt: string;
    currency: string;
    domain: string;
    id: number;
    integration: number;
    name: string;
    recipient_code: string;
    class: string;
    updatedAt: string;
    is_deleted: boolean;
    details: {
      authorization_code: string | null;
      account_number: string;
      account_name: string | null;
      bank_code: string;
      bank_name: string;
    };
  };
}