import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { NotificationsService } from './notifications.service';
import { SmsService } from './sms.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [ConfigModule, HttpModule],
    providers: [EmailService, NotificationsService, SmsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
