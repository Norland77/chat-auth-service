import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { options } from './auth/config';
import { PrismaModule } from './prisma/prisma.module';
@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync(options()),
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
