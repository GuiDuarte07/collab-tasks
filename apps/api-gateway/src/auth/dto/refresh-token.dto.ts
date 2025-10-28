import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de refresh JWT para renovar o access token',
    required: true,
  })
  @IsString({ message: 'O refreshToken deve ser uma string.' })
  readonly refreshToken!: string;
}
