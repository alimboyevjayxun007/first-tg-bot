"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");
const bot_schema_1 = require("../schema/bot.schema");
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = require("axios");
let BotService = class BotService {
    userModel;
    bot;
    ownerID = Number(process.env.OWNER_ID);
    userSessions = new Map();
    aiModeUsers = new Set();
    genAI;
    aiModel;
    constructor(userModel) {
        this.userModel = userModel;
        this.bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
        this.genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.aiModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        this.bot.setMyCommands([
            { command: '/start', description: "Botdan ro'yxatdan o'tish" },
            { command: '/info', description: 'Bot haqida maʼlumot' },
            { command: '/quiz', description: '10 ta matematik savol ishlash' },
            { command: '/suniy_intellekt', description: 'AI bilan suhbat' },
        ]);
        this.bot.onText(/\/info/, async (msg) => {
            const chatId = msg.chat.id;
            this.bot.sendMessage(chatId, "Bot sinov tariqasida yaratilgan va rivojlantirilmoqda.");
        });
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const name = msg.from?.first_name;
            if (chatId === this.ownerID) {
                this.bot.sendMessage(chatId, "Siz owner qilib tayinlangan bo'lishingiz mumkin.");
            }
            else {
                const user = await this.userModel.findOne({ chatId });
                if (!user) {
                    this.bot.sendMessage(chatId, `${name}, botdan ro'yxatdan o'tish uchun telefon raqamingizni jo'nating.`, {
                        reply_markup: {
                            keyboard: [
                                [{ text: "Telefon raqamimni jo'natish", request_contact: true }]
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: true,
                        },
                    });
                }
                else {
                    this.bot.sendMessage(chatId, `${name}, siz allaqachon ro'yxatdan o'tgansiz`);
                    this.bot.sendMessage(chatId, "Sizga qanday yordam bera olaman?", {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                }
            }
        });
        this.bot.onText(/\/quiz/, (msg) => {
            const chatId = msg.chat.id;
            const questions = this.generateQuestions();
            this.userSessions.set(chatId, { questions, current: 0, correct: 0 });
            this.bot.sendMessage(chatId, `1-savol: ${questions[0].question} = ?`);
        });
        this.bot.onText(/\/suniy_intellekt/, (msg) => {
            const chatId = msg.chat.id;
            const name = msg.from?.first_name || 'foydalanuvchi';
            this.aiModeUsers.add(chatId);
            this.bot.sendMessage(chatId, `Salom ${name}, men sun'iy intellektman. Sizga qanday yordam bera olaman?`);
        });
        this.bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            const name = msg.from?.first_name;
            const userid = Number(msg.reply_to_message?.text?.split(',')[0]);
            if (msg.contact) {
                const phoneNumber = msg.contact.phone_number;
                const userIdFromContact = msg.contact.user_id;
                if (chatId === userIdFromContact) {
                    let user = await this.userModel.findOne({ chatId });
                    if (!user) {
                        user = await this.userModel.create({
                            name: name,
                            chatId: chatId,
                            phoneNumber: phoneNumber,
                        });
                        this.bot.sendMessage(this.ownerID, `Yangi foydalanuvchi ro'yxatdan o'tdi: ${name}, Raqami: ${phoneNumber}`);
                        this.bot.sendMessage(chatId, `Rahmat, ${name}! Siz ro'yxatdan o'tdingiz. Telefon raqamingiz: ${phoneNumber}`);
                        this.bot.sendMessage(chatId, "Endi siz botning barcha funksiyalaridan foydalanishingiz mumkin.", {
                            reply_markup: {
                                remove_keyboard: true
                            }
                        });
                    }
                    else if (!user.phoneNumber) {
                        user.phoneNumber = phoneNumber;
                        await user.save();
                        this.bot.sendMessage(this.ownerID, `Foydalanuvchi ${name} raqamini yangiladi: ${phoneNumber}`);
                        this.bot.sendMessage(chatId, `Telefon raqamingiz yangilandi: ${phoneNumber}`);
                        this.bot.sendMessage(chatId, "Endi siz botning barcha funksiyalaridan foydalanishingiz mumkin.", {
                            reply_markup: {
                                remove_keyboard: true
                            }
                        });
                    }
                    else {
                        this.bot.sendMessage(chatId, "Sizning raqamingiz allaqachon ro'yxatdan o'tgan.");
                    }
                }
                else {
                    this.bot.sendMessage(chatId, "Noto'g'ri telefon raqami yuborildi. Iltimos, o'zingizning raqamingizni yuboring.");
                }
                return;
            }
            if (this.aiModeUsers.has(chatId)) {
                if (msg.photo) {
                    await this.bot.sendChatAction(chatId, 'upload_photo');
                    await this.bot.sendMessage(chatId, "Rasmni tahlil qilmoqdaman. Bu bir necha soniya vaqt olishi mumkin, iltimos kuting...");
                    const fileId = msg.photo[msg.photo.length - 1].file_id;
                    try {
                        const fileLink = await this.bot.getFileLink(fileId);
                        const imageBuffer = await this.downloadFile(fileLink);
                        const base64Image = imageBuffer.toString('base64');
                        const mimeType = 'image/jpeg';
                        const promptText = msg.caption || "Bu rasmda nima borligini tahlil qil?";
                        const reply = await this.askGeminiWithImage(promptText, base64Image, mimeType);
                        this.bot.sendMessage(chatId, reply);
                    }
                    catch (error) {
                        console.error("Rasm tahlilida xatolik:", error);
                        this.bot.sendMessage(chatId, "Rasmni tahlil qilishda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
                    }
                }
                else if (msg.text && !msg.text.startsWith('/')) {
                    await this.bot.sendChatAction(chatId, 'typing');
                    await this.bot.sendMessage(chatId, "Sizning so'rovingizni qayta ishlamoqdaman. Bu bir necha soniya vaqt olishi mumkin, iltimos kuting...");
                    try {
                        const reply = await this.askGemini(msg.text);
                        this.bot.sendMessage(chatId, reply);
                    }
                    catch (error) {
                        console.error("AI bilan suhbatda xatolik:", error);
                        this.bot.sendMessage(chatId, "Sun'iy intellektdan javob olayotganda kutilmagan xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
                    }
                }
                else if (msg.video) {
                    this.bot.sendMessage(chatId, "Hozircha videoni tahlil qilish imkoniyati yo'q. Faqat rasmlarni tahlil qila olaman.");
                }
                return;
            }
            if (chatId === this.ownerID && userid) {
                if (msg.text)
                    this.bot.sendMessage(userid, `Ustozdan xabar: ${msg.text}`);
                if (msg.voice)
                    this.bot.sendVoice(userid, msg.voice.file_id);
                if (msg.photo)
                    this.bot.sendPhoto(userid, msg.photo[0].file_id);
                return;
            }
            if (chatId !== this.ownerID && !msg.text?.startsWith('/')) {
                const session = this.userSessions.get(chatId);
                if (session) {
                    const userAnswer = parseInt(`${msg.text}`);
                    const currentQ = session.questions[session.current];
                    if (userAnswer === currentQ.answer)
                        session.correct++;
                    session.current++;
                    if (session.current < session.questions.length) {
                        const nextQ = session.questions[session.current];
                        this.bot.sendMessage(chatId, `${session.current + 1}-savol: ${nextQ.question} = ?`);
                    }
                    else {
                        this.bot.sendMessage(chatId, ` Test yakunlandi: Siz ${session.correct} / ${session.questions.length} ta savolga to'g'ri javob berdingiz.`);
                        this.bot.sendMessage(chatId, ` Yana ishlamoqchimisiz? /quiz buyrug'ini bosing`);
                        this.userSessions.delete(chatId);
                    }
                    return;
                }
                this.bot.sendMessage(this.ownerID, `${chatId}, ${name} dan xabar: ${msg.text || '[Mediya yuborildi]'}`);
                if (msg.voice)
                    this.bot.sendVoice(this.ownerID, msg.voice.file_id);
                if (msg.photo)
                    this.bot.sendPhoto(this.ownerID, msg.photo[0].file_id);
            }
        });
    }
    generateQuestions(count = 10) {
        const questions = [];
        for (let i = 0; i < count; i++) {
            const a = Math.floor(Math.random() * 10);
            const b = Math.floor(Math.random() * 10);
            questions.push({
                question: `${a} + ${b}`,
                answer: a + b,
            });
        }
        return questions;
    }
    async askGemini(prompt) {
        try {
            const result = await this.aiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            return text || "Kechirasiz, tushunmadim. Boshqa savol bering.";
        }
        catch (error) {
            console.error("Gemini SDK (matn) chaqiruvida xatolik yuz berdi:", error);
            return "Sun'iy intellektdan javob olayotganda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.";
        }
    }
    async askGeminiWithImage(prompt, base64Image, mimeType) {
        try {
            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            };
            const parts = [];
            if (prompt) {
                parts.push({ text: prompt });
            }
            parts.push(imagePart);
            const result = await this.aiModel.generateContent({
                contents: [{ role: 'user', parts: parts }],
            });
            const response = result.response;
            const text = response.text();
            return text || "Rasmni tahlil qilishda muammo yuz berdi yoki javob topilmadi.";
        }
        catch (error) {
            console.error("Gemini SDK (rasm) chaqiruvida xatolik yuz berdi:", error);
            return "Rasmni tahlil qilishda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.";
        }
    }
    async downloadFile(fileUrl) {
        const response = await axios_1.default.get(fileUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    }
};
exports.BotService = BotService;
exports.BotService = BotService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(bot_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], BotService);
//# sourceMappingURL=bot.service.js.map