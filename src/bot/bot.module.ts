import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/bot.schema';

@Module({
  imports:[ MongooseModule.forFeature([{name:User.name,schema:UserSchema}])],
  providers: [BotService
   
  ],
  
})
export class BotModule {}
