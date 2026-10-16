import { Body, Controller, Post } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto.js';

@Controller('auth')
export class AuthController {
  // 임시: T4에서 실제 가입 처리로 교체한다
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return { ok: true, nickname: dto.nickname };
  }
}
