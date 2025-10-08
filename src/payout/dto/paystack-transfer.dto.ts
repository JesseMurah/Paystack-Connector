export class InitiatePaystackTransferDto {
  source: string;
  amount: number;
  recipient: string;
  reference: string;
  reason?: string;
  currency?: string;
}

export class PaystackTransferResponseDto {
  status: boolean;
  message: string;
  data: {
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: string;
    transfer_code: string;
    id: number;
    createdAt: string;
    updatedAt: string;
    reference: string;
    source_details: any;
    titan_code: string | null;
    transferred_at: string | null;
    request: number;
    failures: any;
  };
}

export class FinalizeTransferDto {
  transfer_code: string;
  otp: string;
}

export class VerifyTransferResponseDto {
  status: boolean;
  message: string;
  data: {
    recipient: {
      domain: string;
      type: string;
      currency: string;
      name: string;
      details: {
        account_number: string;
        account_name: string | null;
        bank_code: string;
        bank_name: string;
      };
      metadata: any;
      recipient_code: string;
      active: boolean;
      id: number;
      integration: number;
      createdAt: string;
      updatedAt: string;
    };
    domain: string;
    amount: number;
    currency: string;
    source: string;
    source_details: any;
    reason: string;
    status: string;
    failures: any;
    transfer_code: string;
    id: number;
    createdAt: string;
    updatedAt: string;
    titan_code: string | null;
    transferred_at: string | null;
    reference: string;
    integration: number;
    request: number;
  };
}