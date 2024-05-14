import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { options } from './config';
@Module({
  imports: [PassportModule, JwtModule.registerAsync(options())],
  controllers: [AuthController, AuthRepository],
  providers: [AuthService, AuthRepository],
})
export class AuthModule {}
