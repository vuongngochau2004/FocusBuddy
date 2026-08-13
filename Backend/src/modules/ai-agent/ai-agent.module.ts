// src/modules/ai-agent/ai-agent.module.ts
import { Module } from '@nestjs/common';
import { AiAgentController } from './ai-agent.controller';
import { AiAgentService } from './ai-agent.service';
import { SupervisorAgent } from './agents/supervisor.agent';
import { AcademicAgent } from './agents/academic.agent';
import { PsychologyAgent } from './agents/psychology.agent';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiAgentController],
  providers: [AiAgentService, SupervisorAgent, AcademicAgent, PsychologyAgent],
  exports: [AiAgentService],
})
export class AiAgentModule {}
