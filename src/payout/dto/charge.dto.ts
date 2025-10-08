// For Collection
export class InitializeMomoChargeDto {
  email: string;
  amount: number; // in pesewas
  mobile_money: {
    phone: string;
    provider: string; // mtn, vod, tgo
  };
  reference?: string;
}

export class SubmitOTPDto {
  otp: string;
  reference: string;
}