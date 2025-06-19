import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './bot/bot.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot("mongodb+srv://alimboyevjayxun007:ecW5TizRwqTXwrde@fastfoodbot.elc8enu.mongodb.net/?retryWrites=true&w=majority&appName=fastFoodBot"),
  ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }), BotModule]
})
export class AppModule { }
