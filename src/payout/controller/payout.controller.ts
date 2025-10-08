import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus, Param,
  Post, Query,
} from '@nestjs/common';
import { PaystackPayoutService } from '../service/paystack-payout.service';
import { StandardBankPayoutPayload, StandardPayoutDto } from '../dto/standard-payout.dto';
import { StandardPayoutResponseDto } from '../dto/standard-response.dto';


@Controller('payout')
export class PayoutController {
  constructor(
    private readonly payoutService: PaystackPayoutService
  ) {}



  // Momo Payout
  @Post('momo')
  @HttpCode(HttpStatus.OK)
  async processMomoPayout(
    @Body() payload: StandardPayoutDto,
  ): Promise<StandardPayoutResponseDto> {
    return this.payoutService.processMomoPayout(payload);
  }

  // Bank Payout
  @Post('bank')
  @HttpCode(HttpStatus.OK)
  async processBankPayout(
    @Body() payload: StandardBankPayoutPayload,
  ): Promise<StandardPayoutResponseDto> {
    return this.payoutService.processBankPayout(payload);
  }

  // Finalize transaction
  @Post('finalize')
  @HttpCode(HttpStatus.OK)
  async finalizeTransfer(
    @Body()
    body: {
      transfer_code: string;
      otp: string;
      api_key: string;
    },
  ) {
    return this.payoutService.finalizeTransfer(
      body.transfer_code,
      body.otp,
      body.api_key,
    );
  }


  // Verify transaction
  @Get('verify/:reference')
  @HttpCode(HttpStatus.OK)
  async verifyTransfer(
    @Param('reference') reference: string,
    @Query('api_key') apiKey: string,
  ) {
    return this.payoutService.verifyTransfer(reference, apiKey);
  }

}