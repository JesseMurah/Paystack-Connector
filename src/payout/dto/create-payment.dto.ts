import { IsNumber, IsOptional, IsPhoneNumber, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  email: string;

  @IsPhoneNumber()
  phone: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsNumber()
  @Min(100)
  amount: number;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  callbackUrl?: string;
}
