import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

const ENV_MODULE = ConfigModule.forRoot({
  isGlobal: true,
})

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayModule } from './gateway/gateway.modult';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ENV_MODULE,
    GatewayModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
