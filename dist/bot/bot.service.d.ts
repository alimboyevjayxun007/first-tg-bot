import { Model } from 'mongoose';
import { UserDocument } from 'src/schema/bot.schema';
export declare class BotService {
    private userModel;
    private bot;
    private readonly ownerID;
    private userOrders;
    private processedMessageIds;
    private products;
    constructor(userModel: Model<UserDocument>);
    private sendProducts;
    private promptForPhoneNumber;
    private isMessageProcessed;
    private addProcessedMessage;
    private sendBroadcast;
    private downloadFile;
}
