import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

const ENV_MODULE = ConfigModule.forRoot({
  isGlobal: true,
})

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayModule } from './gateway/gateway.modult';

@Module({
  imports: [
    ENV_MODULE,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
