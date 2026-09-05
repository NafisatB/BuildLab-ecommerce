import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './common/exception.filter';

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
  .setTitle('BuildLab E-Commerce API')
  .setDescription('E-commerce backend API')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your JWT access token'
    },
    'access-token',
  )
  .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      operationsSorter: (a: any, b: any)=>{
        const methodOrder: Record<string, number> = {
          get: 1,
          post: 2,
          patch: 3,
          delete: 4,
        };
        return(
          (methodOrder[a.get('method')]?? 99) -(methodOrder[b.get('method')]?? 99)
        )
      },

      tagsSorter:(a: string, b: string)=> {
        const tagOrder: Record<string, number>={
          Authentication: 1,
          Products: 2
        };
        return(
          (tagOrder[a]?? 99) - (tagOrder[b]?? 99)
        )
      }
    }
  })

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
