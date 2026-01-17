import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { FsmService } from './fsm/fsm.service';
import { AuditModule } from '../audit/audit.module';
import { SmsModule } from '../sms/sms.module';
import { OdooModule } from '../odoo/odoo.module';

@Module({
  imports: [AuditModule, SmsModule, OdooModule],
  controllers: [TasksController],
  providers: [TasksService, FsmService],
  exports: [TasksService, FsmService],
})
export class TasksModule {}
