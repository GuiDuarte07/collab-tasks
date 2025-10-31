import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Conteúdo do comentário (suporta rich text HTML/JSON)',
    example: '<p>Este é um comentário com <strong>rich text</strong></p>',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
