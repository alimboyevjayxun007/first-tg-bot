import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './bot/bot.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot("mongodb+srv://alimboyevjayxun007:jQHT0xNZIhNZGEv5@cluster0.nlou3gl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"),
  ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }), BotModule]
})
export class AppModule { }
