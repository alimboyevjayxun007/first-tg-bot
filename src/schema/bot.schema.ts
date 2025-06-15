import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  name: string;

  @Prop({ required: true, unique: true })
  chatId: number; 

  @Prop({ unique: true, sparse: true }) // Yangi qo'shilgan maydon
  phoneNumber?: string; // Telefon raqami ixtiyoriy, chunki foydalanuvchi uni bermasligi mumkin.
                        

  @Prop({ default: Date.now })
  createdAt: Date; 
}

export const UserSchema = SchemaFactory.createForClass(User);