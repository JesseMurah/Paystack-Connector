export class StandardPayoutDto  {
  amount: number;
  currency: string;
  reason?: string;
  network: string;
  id: string;
  accountName: string;
  accountNumber: string;
  reference?: string;
  api_key: string;
}

export class StandardBankPayoutPayload {
  amount: number;
  currency: string;
  reason?: string;
  bankCode: string;
  id: string;
  accountName: string;
  accountNumber: string;
  reference?: string;
  api_key: string;
}