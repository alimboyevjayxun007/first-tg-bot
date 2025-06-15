import { Model } from 'mongoose';
import { UserDocument } from 'src/schema/bot.schema';
export declare class BotService {
    private userModel;
    private bot;
    private readonly ownerID;
    private userSessions;
    private aiModeUsers;
    private genAI;
    private aiModel;
    constructor(userModel: Model<UserDocument>);
    private generateQuestions;
    private askGemini;
    private askGeminiWithImage;
    private downloadFile;
}
