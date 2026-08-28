import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './common/filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false
      }
    })
  );

  app.useGlobalFilters(
    new PrismaExceptionFilter()
  )

  const swaggerConfig = new DocumentBuilder()
  .setTitle('E-Commerce Product Management API')
  .setDescription('RESTful API for managing products in an e-commerce platform')
  .setVersion('1.0')
  .addTag('Products')
  .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  })

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
