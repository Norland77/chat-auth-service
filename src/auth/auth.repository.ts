import { Controller } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IToken } from './interfaces/IToken';
import { Token } from '@prisma/client';
import { v4 } from 'uuid';
import { add } from 'date-fns';

@Controller('auth')
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async logout(refreshToken: string): Promise<IToken> {
    return this.prismaService.token.delete({
      where: { token: refreshToken },
    });
  }

  async findToken(refreshToken: string): Promise<IToken | null> {
    return this.prismaService.token.findUnique({
      where: { token: refreshToken },
    });
  }

  async deleteToken(refreshToken: string): Promise<IToken> {
    return this.prismaService.token.delete({
      where: { token: refreshToken },
    });
  }

  async getRefreshToken(userId: string, userAgent: string): Promise<Token> {
    const _token = await this.prismaService.token.findFirst({
      where: {
        userId,
      },
    });
    const token = _token?.token ?? '';
    return this.prismaService.token.upsert({
      where: { token, userAgent },
      update: {
        token: v4(),
        exp: add(new Date(), { months: 1 }),
      },
      create: {
        token: v4(),
        exp: add(new Date(), { months: 1 }),
        userId,
        userAgent,
      },
    });
  }

  async createConfirmCode(email: string, code: string) {
    return this.prismaService.confirmationCodes.create({
      data: {
        email,
        code,
      },
    });
  }

  async findCodeByEmail(email: string) {
    return this.prismaService.confirmationCodes.findFirst({
      where: {
        email,
      },
    });
  }

  async updateCodeById(id: string, code: string) {
    return this.prismaService.confirmationCodes.update({
      where: {
        id,
      },
      data: {
        code,
      },
    });
  }

  async getAllAccountByAgent(userAgent: string) {
    return this.prismaService.token.findMany({
      where: {
        userAgent,
      },
      select: {
        user: true,
      },
    });
  }

  async findTokenByAgent(userAgent: string, userId: string) {
    return this.prismaService.token.findFirst({
      where: {
        AND: { userAgent, userId },
      },
    });
  }
}
