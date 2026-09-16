import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [OrderController],
  providers: [OrderService]
})
export class OrderModule {}
