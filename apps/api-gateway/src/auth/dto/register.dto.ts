import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'john doe',
    description: 'Nome do usuário',
    minLength: 3,
    maxLength: 80,
    required: true,
  })
  @IsString({ message: 'Nome deve ser uma string.' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres.' })
  @MaxLength(80, { message: 'Nome deve ter no máximo 20 caracteres.' })
  readonly name!: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Nome de usuário único do sistema',
    minLength: 3,
    maxLength: 20,
    required: true,
  })
  @IsString({ message: 'O username deve ser uma string.' })
  @MinLength(3, { message: 'O username deve ter pelo menos 3 caracteres.' })
  @MaxLength(20, { message: 'O username deve ter no máximo 20 caracteres.' })
  readonly username!: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'E-mail válido do usuário',
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
