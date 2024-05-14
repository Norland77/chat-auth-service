import {
  BadRequestException,
  Controller,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ClientProxy,
  ClientProxyFactory,
  MessagePattern,
  Transport,
} from '@nestjs/microservices';
import { LoginDto, RegisterDto } from './dto';
import { IUser } from './interfaces/IUser';
import { ConfirmCodeDto } from './dto/confirm-code.dto';
import { ITokens } from './interfaces';
import { compareSync } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { IToken } from './interfaces/IToken';
import { defaultIfEmpty, firstValueFrom, Observable } from 'rxjs';

@Controller('auth')
export class AuthController {
  private readonly user_client: ClientProxy;
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.user_client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 5001,
      },
    });
  }
  @MessagePattern('post.register')
  async register(dto: RegisterDto): Promise<Observable<IUser>> {
    const user: Observable<IUser | undefined> = this.user_client
      .send('get.users.byName', { name: dto.username, email: dto.email })
      .pipe(defaultIfEmpty(undefined));
    const Username = await firstValueFrom(user);

    if (Username) {
      throw new BadRequestException('This username or email is already in use');
    }
    return this.user_client.send('post.users.create', dto);
  }

  @MessagePattern('post.send-email')
  async sendCodeToEmail(emailDto: { email: string }) {
    const code = await this.authService.sendCodeViaEmail(emailDto.email);

    const existCode = await this.authService.findCodeByEmail(emailDto);

    if (existCode) {
      await this.authService.updateCodeById(existCode.id, String(code));
    } else {
      await this.authService.createConfirmCode(emailDto.email, String(code));
    }

    return true;
  }

  @MessagePattern('post.confirm-code')
  async confirmCode(dto: ConfirmCodeDto) {
    return this.authService.findCodeByEmail(dto, true);
  }

  @MessagePattern('post.login')
  async login(data: { dto: LoginDto; userAgent: string }): Promise<ITokens> {
    const user: Observable<IUser> = this.user_client.send(
      'get.users.byEmail',
      data.dto.email,
    );
    const currentUser = await firstValueFrom(user);
    if (!currentUser || !compareSync(data.dto.password, currentUser.password)) {
      throw new UnauthorizedException('Wrong login or password');
    }
    return this.authService.login(currentUser, data.userAgent);
  }

  @MessagePattern('get.refresh-tokens')
  async refreshToken(data: { refreshToken: string }): Promise<ITokens> {
    const token: IToken = await this.authService.refreshToken(
      data.refreshToken,
    );

    const user: Observable<IUser> = this.user_client.send(
      'get.users.byId',
      token.userId,
    );
    const currentUser = await firstValueFrom(user);

    return await this.authService.refresh(currentUser, token);
  }

  @MessagePattern('get.all-account')
  async getAllAccountByAgent(userAgent: string) {
    return this.authService.getAllAccountByAgent(userAgent);
  }

  @MessagePattern('post.login-userAgent')
  async loginUserAgent(data: { userAgent: string; userId: string }) {
    const token = await this.authService.findTokenByAgent(
      data.userAgent,
      data.userId,
    );

    const user: Observable<IUser> = this.user_client.send(
      'get.users.byId',
      token.userId,
    );
    const currentUser = await firstValueFrom(user);

    return await this.authService.refresh(currentUser, token);
  }

  @MessagePattern('post.delete-saved-account')
  async deleteSavedAccount(data: { userAgent: string; userId: string }) {
    const token = await this.authService.findTokenByAgent(
      data.userAgent,
      data.userId,
      true,
    );

    return this.authService.deleteToken(token.token);
  }
}
