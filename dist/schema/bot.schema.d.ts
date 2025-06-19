import { HydratedDocument } from 'mongoose';
export type UserDocument = HydratedDocument<User>;
export declare class User {
    name: string;
    chatId: number;
    phoneNumber?: string;
    createdAt: Date;
}
export declare const UserSchema: any;
