import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { NotificationsService } from './notifications.service';
import { SmsService } from './sms.service';

@Module({
    imports: [ConfigModule],
    providers: [EmailService, NotificationsService, SmsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
