import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../database/prisma.module';
import { EmailModule } from '../email/email.module';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { AdminDataGuard } from './admin-data.guard';

@Module({
  imports: [PrismaModule, EmailModule, JwtModule],
  controllers: [DataController],
  providers: [DataService, AdminDataGuard],
})
export class DataModule {}
