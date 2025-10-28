import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'E-mail cadastrado do usuário',
    required: true,
  })
  @IsEmail({}, { message: 'O e-mail informado é inválido.' })
  readonly email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Senha do usuário (mínimo de 6 caracteres)',
    minLength: 6,
    required: true,
  })
  @IsString({ message: 'A senha deve ser uma string.' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  readonly password!: string;
}
