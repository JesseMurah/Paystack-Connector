import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StandardBankPayoutPayload, StandardPayoutDto } from '../dto/standard-payout.dto';
import { CreatePaystackRecipientInput, PaystackRecipientResponseDto } from '../dto/paystack-recipient.dto';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import {
  FinalizeTransferDto,
  InitiatePaystackTransferDto,
  PaystackTransferResponseDto, VerifyTransferResponseDto,
} from '../dto/paystack-transfer.dto';
import { StandardPayoutResponseDto } from '../dto/standard-response.dto';


@Injectable()
export class PaystackPayoutService {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    this.secretKey = this.configService.get<string>('paystack.secretKey')!;
    this.baseUrl = this.configService.get<string>('paystack.baseUrl')!;
  }


  private async makePaystackRequest(
    endpoint: string,
    method: string,
    body?: any,
  ) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new BadRequestException(data.message || 'Paystack API error');
      }

      return data;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to communicate with Paystack',
      );
    }
  }


  // Create transfer recipient for momo
  async createMoMoRecipient(
    payload: StandardPayoutDto
  ): Promise<PaystackRecipientResponseDto> {
    try {
      const recipient: CreatePaystackRecipientInput = {
        type: 'mobile_money',
        name: payload.accountName, // MoMo name
        account_number: payload.accountNumber, //Momo number
        bank_code: payload.network,
        currency: payload.currency,
        description: `Money transferred to ${payload.accountName} to ${payload.accountNumber}`,
        metadata: {
          gateway_id: payload.id,
        },
      };

      const response = await firstValueFrom(
        this.httpService.post<PaystackRecipientResponseDto>(
          `${this.baseUrl}/transferrecipient`,
          recipient,
          {
            headers: this.secretKey,
          },
        ),
      );

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to create the recipient');
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'Create Recipient')
    }
  }

  // Create transfer recipient for a bank
  async creatBankRecipient(
    payload: StandardBankPayoutPayload
  ): Promise<PaystackRecipientResponseDto> {
    try {
      const recipient: CreatePaystackRecipientInput = {
        type: 'nuban',
        name: payload.accountName, // Account name
        account_number: payload.accountNumber, //Account number
        bank_code: payload.bankCode,
        currency: payload.currency,
        description: `Bank transfer to ${payload.accountName} to ${payload.accountNumber}`,
        metadata: {
          gateway_id: payload.id,
        },
      };

      const response = await firstValueFrom(
        this.httpService.post<PaystackRecipientResponseDto>(
          `${this.baseUrl}/transferrecipient`,
          recipient,
          {
            headers: this.secretKey,
          },
        ),
      );

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to create the recipient');
      }

      return response.data;
    } catch (error) {
      this.handleError(error, 'Create Recipient')
    }
  }

  async initiateTransfer(
    recipientCode: string,
    payload: StandardPayoutDto | StandardBankPayoutPayload,
  ): Promise<PaystackTransferResponseDto> {
    try {
      const ref = payload.reference || this.generateReference()

      const transfer: InitiatePaystackTransferDto = {
        source: 'balance',
        amount: payload.amount,
        recipient: recipientCode,
        reference: ref,
        reason: payload.reason || 'Payout',
        currency: payload.currency,
      };

      const res = await firstValueFrom(
        this.httpService.post<PaystackTransferResponseDto>(
          `${this.baseUrl}/transfer`,
          transfer,
          {
            headers: this.secretKey
          },
        ),
      );

      if (!res.data.status) {
        throw new BadRequestException(res.data.message || 'Failed to initiate transfer');
      };

      return res.data;
    } catch (error) {
      this.handleError(error, 'Initiate transfer');
    }
  }

  async finalizeTransfer(
    transferCode: string,
    otpCode: string,
    secret_key: string,
  ): Promise<PaystackTransferResponseDto> {
    try {
      const finalize: FinalizeTransferDto = {
        transfer_code: transferCode,
        otp: otpCode,
      };

      const res = await firstValueFrom(
        this.httpService.post<PaystackTransferResponseDto>(
          `${this.baseUrl}/transfer/finalize_transfer`,
          finalize,
          {
            headers: this.secretKey
          },
        ),
      )

      if (!res.data.status) {
        throw new BadRequestException(res.data.message || 'Failed to initiate transfer');
      }

      return res.data;
    } catch (e) {
      this.handleError(e, 'Finalize transfer');
    }
  }

  async verifyTransfer(
    reference: string,
    secret_key: string,
  ): Promise<VerifyTransferResponseDto> {
    try {
      const res = await firstValueFrom(
        this.httpService.get<VerifyTransferResponseDto>(
          `${this.baseUrl}/transfer/verify/${reference}`,
          {
            headers: this.secretKey,
          },
        ),
      )
      if (!res.data.status) {
        throw new BadRequestException(res.data.message || 'Failed to verify the transfer');
      }

      return res.data;
    } catch (e) {
      this.handleError(e, 'Verify Transfer');
    }
  }

  async processMomoPayout(
    payload: StandardPayoutDto,
  ): Promise<StandardPayoutResponseDto> {
    try {
      // Create recipient
      const recipientResponse = await this.createMoMoRecipient(payload);
      const recipientCode = recipientResponse.data.recipient_code;

      // Initiate transfer
      const transferResponse = await this.initiateTransfer(
        recipientCode,
        payload,
      );

      // Check if OTP is required
      if (
        transferResponse.data.status === 'otp' ||
        transferResponse.message.toLowerCase().includes('otp')
      ) {
        return {
          success: false,
          message:
            'OTP required. Please call finalizeTransfer with the OTP sent to your phone.',
          data: {
            reference: transferResponse.data.reference,
            provider_reference: transferResponse.data.transfer_code,
            amount: transferResponse.data.amount,
            currency: transferResponse.data.currency,
            status: 'pending_otp',
            recipient: {
              name: payload.accountName,
              account_number: payload.accountNumber,
              network: payload.network,
            },
            timestamp: new Date().toISOString(),
            // transfer_code: transferResponse.data.transfer_code,
          },
        };
      }

      //Return success/pending response
      return this.mapToStandardResponse(transferResponse, payload, 'momo');
    } catch (error) {
      throw error;
    }
  }

  async processBankPayout(
    payload: StandardBankPayoutPayload,
  ): Promise<StandardPayoutResponseDto> {
    try {
      //Create recipient
      const recipientResponse = await this.creatBankRecipient(payload);
      const recipientCode = recipientResponse.data.recipient_code;

      //Initiate transfer
      const transferResponse = await this.initiateTransfer(
        recipientCode,
        payload,
      );

      //Check if OTP is required
      if (
        transferResponse.data.status === 'otp' ||
        transferResponse.message.toLowerCase().includes('otp')
      ) {
        return {
          success: false,
          message:
            'OTP required. Please call finalizeTransfer with the OTP sent to your phone.',
          data: {
            reference: transferResponse.data.reference,
            provider_reference: transferResponse.data.transfer_code,
            amount: transferResponse.data.amount,
            currency: transferResponse.data.currency,
            status: 'pending_otp',
            recipient: {
              name: payload.accountName,
              account_number: payload.accountNumber,
              bank_code: payload.bankCode,
            },
            timestamp: new Date().toISOString(),
            // transfer_code: transferResponse.data.transfer_code,
          },
        };
      }

      //Return success/pending response
      return this.mapToStandardResponse(transferResponse, payload, 'bank');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Map Paystack response to Standard response
   */
  private mapToStandardResponse(
    paystackResponse: PaystackTransferResponseDto,
    payload: StandardPayoutDto | StandardBankPayoutPayload,
    type: 'momo' | 'bank',
  ): StandardPayoutResponseDto {
    const isSuccess = paystackResponse.data.status === 'success';
    const isPending = paystackResponse.data.status === 'pending';

    return {
      success: isSuccess || isPending,
      message: paystackResponse.message,
      data: {
        reference: paystackResponse.data.reference,
        provider_reference: paystackResponse.data.transfer_code,
        amount: paystackResponse.data.amount,
        currency: paystackResponse.data.currency,
        status: paystackResponse.data.status,
        recipient: {
          name: payload.accountName,
          account_number: payload.accountNumber,
          ...(type === 'momo' && {
            network: (payload as StandardPayoutDto).network,
          }),
          ...(type === 'bank' && {
            bank_code: (payload as StandardBankPayoutPayload).bankCode,
          }),
        },
        timestamp: paystackResponse.data.createdAt,
      },
    };
  }


  private generateReference(): string {
    return `TRF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleError(error: any, context: string): never {
    const message =
      error.response?.data?.message ||
      error.message ||
      `${context} failed`;
    const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

    throw new HttpException(
      {
        success: false,
        message: message,
        context: context,
      },
      status,
    );
  }


}


