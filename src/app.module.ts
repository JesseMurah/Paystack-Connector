import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PayoutController } from './payout/controller/payout.controller';
import { PaystackPayoutService } from './payout/service/paystack-payout.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(
    {
      envFilePath: '.env'
    }
  )],
  controllers: [AppController, PayoutController],
  providers: [AppService, PaystackPayoutService],
})
export class AppModule {}
