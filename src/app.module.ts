import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { PasswordService } from './auth/password/password.service';
import { AuthModule } from './auth/auth.module';
import { UsersService } from './users/users.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true,}),
    ProductsModule, DatabaseModule, AuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService, PasswordService, UsersService],
  exports: [PasswordService]
})
export class AppModule {}
