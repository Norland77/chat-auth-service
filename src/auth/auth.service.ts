import {
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { IToken } from './interfaces/IToken';
import { AuthRepository } from './auth.repository';
import { ITokens } from './interfaces';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createTransport } from 'nodemailer';
import { IUser } from './interfaces/IUser';
import { ConfirmCodeDto } from './dto/confirm-code.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
  async refreshToken(refreshToken: string): Promise<IToken> {
    const string = '';
    if (typeof refreshToken !== typeof string) {
      throw new UnauthorizedException();
    }
    const token = await this.authRepository.findToken(refreshToken);
    if (!token) {
      throw new UnauthorizedException();
    }

    if (new Date(token.exp) < new Date()) {
      await this.authRepository.deleteToken(refreshToken);
      throw new UnauthorizedException();
    }

    return token;
  }

  async logout(refreshToken: string): Promise<IToken> {
    return this.authRepository.logout(refreshToken);
  }

  async setRefreshTokenToCookies(
    tokens: ITokens,
    res: Response,
  ): Promise<void> {
    if (!tokens) {
      throw new UnauthorizedException();
    }
    res.cookie(
      this.configService.get('REFRESH_TOKEN'),
      tokens.refreshToken.token,
      {
        httpOnly: true,
        sameSite: 'lax',
        expires: new Date(tokens.refreshToken.exp),
        secure:
          this.configService.get('NODE_ENV', 'development') === 'production',
        path: '/',
      },
    );
    res.status(HttpStatus.CREATED).json({ accessToken: tokens.accessToken });
  }

  async login(user: IUser, userAgent: string): Promise<ITokens> {
    const accessToken = this.jwtService.sign({
      id: user.id,
      username: user.username,
    });
    const refreshToken = await this.authRepository.getRefreshToken(
      user.id,
      userAgent,
    );

    if (!refreshToken || !accessToken) {
      throw new BadRequestException(`Can't login user`);
    }

    return { accessToken, refreshToken };
  }

  async refresh(user: IUser, refreshToken: IToken): Promise<ITokens> {
    const accessToken = this.jwtService.sign({
      id: user.id,
      username: user.username,
    });

    return { accessToken, refreshToken };
  }

  async createConfirmCode(email: string, code: string) {
    return this.authRepository.createConfirmCode(email, code);
  }

  async findCodeByEmail(dto: ConfirmCodeDto, isConfirm?: boolean) {
    const code = await this.authRepository.findCodeByEmail(dto.email);

    if (!code && isConfirm) {
      throw new BadRequestException(`code with email: ${dto.email} not found`);
    }

    if (isConfirm) {
      if (code.code === dto.code) {
        return code;
      } else {
        throw new BadRequestException(`incorrect code`);
      }
    }
  }

  async updateCodeById(id: string, code: string) {
    return this.authRepository.updateCodeById(id, code);
  }

  async getAllAccountByAgent(userAgent: string) {
    return this.authRepository.getAllAccountByAgent(userAgent);
  }

  async findTokenByAgent(
    userAgent: string,
    userId: string,
    isDelete?: boolean,
  ) {
    const token = await this.authRepository.findTokenByAgent(userAgent, userId);

    if (!token) {
      throw new BadRequestException();
    }

    if (new Date(token.exp) < new Date() && !isDelete) {
      throw new UnauthorizedException();
    }

    return token;
  }

  async deleteToken(token: string) {
    return this.authRepository.deleteToken(token);
  }

  async sendCodeViaEmail(email: string) {
    const transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'flashchaatt@gmail.com',
        pass: this.configService.get('GOOGLE_APP_KEY'),
      },
    });

    const code = Math.floor(100000 + Math.random() * 900000);

    const mail = await transporter.sendMail({
      from: '"Flash Chat" <flashchaatt@gmail.com>',
      to: email,
      subject: 'Confirmation code',
      html: `
        <body style="background-color: #181818; text-align: center; color: #F0F0F0 !important; padding: 25px">
          <h1 style="font-size: 32px; font-weight: bold; color: #F0F0F0 !important">Confirmation code</h1>
          <p style="font-size: 20px; color: #F0F0F0 !important">
              You received this message because this email was specified for registration in flash chat. To continue registration, please enter the specified code on the code entry page.
          </p>
          <span style="height: 50px; font-size: 34px; border: solid 1px #303030; width: fit-content; padding: 5px 10px; border-radius: 15px; letter-spacing: 5px; color: #F0F0F0 !important">
              ${code}
          </span>
        </body>
      `,
    });

    if (!mail) {
      throw new BadRequestException('Email dont receive');
    }

    return code;
  }
}
