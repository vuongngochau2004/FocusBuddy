// src/modules/ai-agent/ai-agent.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AiAgentService, ChatMessageDto } from './ai-agent.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('AI Chatbot')
@ApiBearerAuth()
@Controller('chat')
export class AiAgentController {
  constructor(private readonly agentService: AiAgentService) {}

  @Post()
  @ApiOperation({
    summary: 'Gửi tin nhắn đến chatbot multi-agent',
    description:
      'Supervisor Agent tự phân loại intent rồi route đến Academic hoặc Psychology agent.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'clxxx...', nullable: true },
        message: { type: 'string', example: 'Điểm của tôi thế nào?' },
      },
      required: ['message'],
    },
  })
  sendMessage(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChatMessageDto,
  ) {
    return this.agentService.chat(userId, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Lấy danh sách phiên chat' })
  getSessions(@CurrentUser('sub') userId: string) {
    return this.agentService.getSessions(userId);
  }

  @Get('sessions/:sessionId/history')
  @ApiOperation({ summary: 'Lấy lịch sử chat của một phiên' })
  @ApiParam({ name: 'sessionId' })
  getHistory(
    @CurrentUser('sub') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.agentService.getHistory(userId, sessionId);
  }
}
