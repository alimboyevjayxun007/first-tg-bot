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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");
const bot_schema_1 = require("../schema/bot.schema");
const axios_1 = require("axios");
let BotService = class BotService {
    userModel;
    bot;
    ownerID = Number(process.env.OWNER_ID);
    userOrders = new Map();
    processedMessageIds = new Set();
    products = {
        'Ichimliklar': [
            { name: 'Cola 1L', price: 12000, image: 'https://ru.freepik.com/free-ai-image/delicious-burger-with-fresh-ingredients_72554083.htm#fromView=keyword&page=1&position=0&uuid=b266d625-88de-4918-8e0f-b6482241840d&query=Fast+Food', description: 'Yangi va sovuq cola.' },
            { name: 'Fanta 1L', price: 11000, image: 'https://ru.freepik.com/free-ai-image/delicious-burger-with-fresh-ingredients_72554083.htm#fromView=keyword&page=1&position=0&uuid=b266d625-88de-4918-8e0f-b6482241840d&query=Fast+Food', description: 'Apelsinli ichimlik.' },
            { name: 'Sprite 1L', price: 11500, image: 'https://ru.freepik.com/free-ai-image/delicious-burger-with-fresh-ingredients_72554083.htm#fromView=keyword&page=1&position=0&uuid=b266d625-88de-4918-8e0f-b6482241840d&query=Fast+Food', description: 'Limon va Laymli gazli ichimlik.' }
        ],
        'Yeguliklar': [
            { name: 'Burger', price: 25000, image: 'https://ru.freepik.com/free-ai-image/delicious-burger-with-fresh-ingredients_72554083.htm#fromView=keyword&page=1&position=0&uuid=b266d625-88de-4918-8e0f-b6482241840d&query=Fast+Food', description: 'Go\'shtli va mazali burger.' },
            { name: 'Lavash', price: 20000, image: 'https://ru.freepik.com/free-ai-image/delicious-burger-with-fresh-ingredients_72554083.htm#fromView=keyword&page=1&position=0&uuid=b266d625-88de-4918-8e0f-b6482241840d&query=Fast+Food', description: 'Mazali va to\'yimli lavash.' },
            { name: 'Hot Dog', price: 15000, image: 'https://ru.freepik.com/free-ai-image/delicious-burger-with-fresh-ingredients_72554083.htm#fromView=keyword&page=1&position=0&uuid=b266d625-88de-4918-8e0f-b6482241840d&query=Fast+Food', description: 'Klassik hot dog.' }
        ],
        'Shirinliklar': [
            { name: 'Tort', price: 18000, image: 'https://ru.freepik.com/free-ai-image/delicious-burger-with-fresh-ingredients_72554083.htm#fromView=keyword&page=1&position=0&uuid=b266d625-88de-4918-8e0f-b6482241840d&query=Fast+Food', description: 'Shokoladli tort.' },
            { name: 'Donut', price: 9000, image: 'https://ru.freepik.com/free-ai-image/delicious-burger-with-fresh-ingredients_72554083.htm#fromView=keyword&page=1&position=0&uuid=b266d625-88de-4918-8e0f-b6482241840d&query=Fast+Food', description: 'Shirin va yumshoq donut.' },
            { name: 'Chizkeyk', price: 22000, image: 'https://ru.freepik.com/free-ai-image/delicious-burger-with-fresh-ingredients_72554083.htm#fromView=keyword&page=1&position=0&uuid=b266d625-88de-4918-8e0f-b6482241840d&query=Fast+Food', description: 'Yengil va mazali chizkeyk.' }
        ]
    };
    constructor(userModel) {
        this.userModel = userModel;
        if (!process.env.BOT_TOKEN) {
            console.error("Error: BOT_TOKEN is not defined in environment variables.");
            process.exit(1);
        }
        if (!process.env.PAYMENT_PROVIDER_TOKEN) {
            console.error("Warning: PAYMENT_PROVIDER_TOKEN is not defined. Payment functionalities might be limited.");
        }
        if (!process.env.OWNER_ID) {
            console.error("Warning: OWNER_ID is not defined. Admin functionalities might be limited.");
        }
        this.bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
        this.bot.setMyCommands([
            { command: "/start", description: "Ro'yxatdan o'tish va menyuni ko'rish" },
            { command: "/info", description: "Bot haqida ma'lumot" },
            { command: "/myorder", description: "Mening buyurtmalarim" },
            { command: "/clearorder", description: "Buyurtmani tozalash" }
        ]);
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const name = msg.from?.first_name;
            const user = await this.userModel.findOne({ chatId });
            if (!user || !user.phoneNumber) {
                this.promptForPhoneNumber(chatId, name);
                return;
            }
            this.userOrders.set(chatId, []);
            this.bot.sendMessage(chatId, `Assalomu alaykum, ${name}! Mazza Food botiga xush kelibsiz.`, {
                reply_markup: {
                    keyboard: [
                        [{ text: "Ichimliklar" }],
                        [{ text: "Yeguliklar" }],
                        [{ text: "Shirinliklar" }],
                        [{ text: "Manzilni yuborish", request_location: true }]
                    ],
                    resize_keyboard: true,
                },
            });
        });
        this.bot.onText(/\/info/, async (msg) => {
            const chatId = msg.chat.id;
            const user = await this.userModel.findOne({ chatId });
            if (!user || !user.phoneNumber) {
                this.promptForPhoneNumber(chatId, msg.from?.first_name);
                return;
            }
            this.bot.sendMessage(chatId, "Mazza Food tezkor va mazali ovqatlar shaxobchasining ovqat buyurtma qilish uchun telegram boti! Bizning shiorimiz: Tez, Mazali, Sifatli!");
        });
        this.bot.onText(/\/myorder/, async (msg) => {
            const chatId = msg.chat.id;
            const user = await this.userModel.findOne({ chatId });
            if (!user || !user.phoneNumber) {
                this.promptForPhoneNumber(chatId, msg.from?.first_name);
                return;
            }
            const order = this.userOrders.get(chatId) || [];
            if (order.length === 0) {
                this.bot.sendMessage(chatId, "Sizda hozircha buyurtmalar yo'q. Menyudan mahsulot tanlang.");
                return;
            }
            const total = order.reduce((sum, item) => sum + item.price, 0);
            const orderList = order.map((item, index) => `${index + 1}. ${item.name} - ${item.price} so'm`).join('\n');
            this.bot.sendMessage(chatId, `🧾 **Mening buyurtmalarim:**\n${orderList}\n\n**💰 Jami:** ${total} so'm`, { parse_mode: 'Markdown' });
        });
        this.bot.onText(/\/clearorder/, async (msg) => {
            const chatId = msg.chat.id;
            const user = await this.userModel.findOne({ chatId });
            if (!user || !user.phoneNumber) {
                this.promptForPhoneNumber(chatId, msg.from?.first_name);
                return;
            }
            this.userOrders.set(chatId, []);
            this.bot.sendMessage(chatId, "✅ Buyurtmangiz tozalandi.");
        });
        this.bot.on('message', async (msg) => {
            if (msg.text && msg.text.startsWith('/')) {
                return;
            }
            if (this.isMessageProcessed(msg.message_id.toString())) {
                return;
            }
            this.addProcessedMessage(msg.message_id.toString());
            const chatId = msg.chat.id;
            const name = msg.from?.first_name;
            const text = msg.text;
            const user = await this.userModel.findOne({ chatId });
            if (msg.contact) {
                const phoneNumber = msg.contact.phone_number;
                const userIdFromContact = msg.contact.user_id;
                if (chatId === userIdFromContact) {
                    let updatedUser = await this.userModel.findOne({ chatId });
                    if (!updatedUser) {
                        updatedUser = await this.userModel.create({ name, chatId, phoneNumber });
                        this.bot.sendMessage(this.ownerID, `Yangi foydalanuvchi ro'yxatdan o'tdi: ${name}, Raqami: ${phoneNumber}`);
                        this.bot.sendMessage(chatId, `Rahmat, ${name}! Siz ro'yxatdan o'tdingiz. Telefon raqamingiz: ${phoneNumber}`);
                    }
                    else if (!updatedUser.phoneNumber) {
                        updatedUser.phoneNumber = phoneNumber;
                        await updatedUser.save();
                        this.bot.sendMessage(this.ownerID, `Foydalanuvchi ${name} raqamini yangiladi: ${phoneNumber}`);
                        this.bot.sendMessage(chatId, `Telefon raqamingiz yangilandi: ${phoneNumber}`);
                    }
                    else {
                        this.bot.sendMessage(chatId, "Sizning raqamingiz allaqachon ro'yxatdan o'tgan.");
                    }
                    this.bot.sendMessage(chatId, "Endi siz botning barcha funksiyalaridan foydalanishingiz mumkin.", {
                        reply_markup: { remove_keyboard: true },
                    });
                    this.bot.sendMessage(chatId, `Menyuni tanlang:`, {
                        reply_markup: {
                            keyboard: [
                                [{ text: "Ichimliklar" }],
                                [{ text: "Yeguliklar" }],
                                [{ text: "Shirinliklar" }],
                                [{ text: "Manzilni yuborish", request_location: true }]
                            ],
                            resize_keyboard: true,
                        },
                    });
                }
                else {
                    this.bot.sendMessage(chatId, "Noto'g'ri telefon raqami yuborildi. Iltimos, o'zingizning raqamingizni yuboring.");
                }
                return;
            }
            if (!user || !user.phoneNumber) {
                this.promptForPhoneNumber(chatId, name);
                return;
            }
            if (text && this.products[text]) {
                this.sendProducts(chatId, text, this.products[text]);
                return;
            }
            if (msg.location) {
                this.bot.sendMessage(chatId, "Manzilingiz qabul qilindi. Buyurtmangiz shu manzilga yetkaziladi.");
                this.bot.sendLocation(this.ownerID, msg.location.latitude, msg.location.longitude);
                this.bot.sendMessage(this.ownerID, `Yangi buyurtma uchun yetkazib berish manzili: ${chatId}, ${name} dan.`);
                return;
            }
            if (chatId === this.ownerID && msg.reply_to_message) {
                const originalText = msg.reply_to_message.text || msg.reply_to_message.caption || '';
                const userIdMatch = originalText.match(/^(\d+),/);
                if (userIdMatch) {
                    const targetUserId = Number(userIdMatch[1]);
                    try {
                        if (msg.text)
                            await this.bot.sendMessage(targetUserId, `Yaratuvchidan: ${msg.text}`);
                        else if (msg.voice)
                            await this.bot.sendVoice(targetUserId, msg.voice.file_id);
                        else if (msg.video)
                            await this.bot.sendVideo(targetUserId, msg.video.file_id);
                        else if (msg.video_note)
                            await this.bot.sendVideoNote(targetUserId, msg.video_note.file_id);
                        else if (msg.photo)
                            await this.bot.sendPhoto(targetUserId, msg.photo[msg.photo.length - 1].file_id);
                        this.bot.sendMessage(this.ownerID, `✅ Xabar ${targetUserId} ga yuborildi.`);
                    }
                    catch (error) {
                        console.error(`Xabarni ${targetUserId} ga yuborishda xatolik:`, error);
                        this.bot.sendMessage(this.ownerID, `Xabarni ${targetUserId} ga yuborishda xatolik yuz berdi.`);
                    }
                }
                else {
                    this.bot.sendMessage(this.ownerID, "❌ Replydan chat ID topilmadi. Iltimos, reply formatiga e’tibor bering (ID, text...).");
                }
                return;
            }
            if (chatId === this.ownerID && !msg.reply_to_message) {
                await this.sendBroadcast(msg);
                return;
            }
            if (chatId !== this.ownerID) {
                let ownerMessage = `${chatId}, ${name} dan yangi xabar:\n`;
                if (msg.text)
                    ownerMessage += `**Matn:** ${msg.text}`;
                else if (msg.voice)
                    ownerMessage += `**Ovozli xabar**`;
                else if (msg.photo)
                    ownerMessage += `**Rasm**`;
                else if (msg.video)
                    ownerMessage += `**Video**`;
                else if (msg.video_note)
                    ownerMessage += `**Video qayd**`;
                else if (msg.contact)
                    ownerMessage += `**Kontakt**`;
                else if (msg.location)
                    ownerMessage += `**Joylashuv**`;
                else
                    ownerMessage += `**Noma'lum turdagi xabar**`;
                this.bot.sendMessage(this.ownerID, ownerMessage, { parse_mode: 'Markdown' });
                if (text && !text.startsWith('/')) {
                    this.bot.sendMessage(chatId, "Uzr, men sizni tushunmadim. Menyudan tanlang yoki buyruqlardan foydalaning.");
                }
            }
        });
        this.bot.on('callback_query', async (query) => {
            const chatId = query.message?.chat.id;
            const data = query.data;
            if (!chatId || !data)
                return;
            const user = await this.userModel.findOne({ chatId });
            if (!user || !user.phoneNumber) {
                await this.bot.answerCallbackQuery(query.id, { text: "Iltimos, avval telefon raqamingizni ro'yxatdan o'tkazing." });
                this.promptForPhoneNumber(chatId, user?.name || query.from?.first_name);
                return;
            }
            if (this.isMessageProcessed(query.id.toString())) {
                this.bot.answerCallbackQuery(query.id);
                return;
            }
            this.addProcessedMessage(query.id.toString());
            if (data.startsWith('buy_')) {
                const [, name, priceStr] = data.split('_');
                const price = parseInt(priceStr);
                const order = this.userOrders.get(chatId) || [];
                order.push({ name, price });
                this.userOrders.set(chatId, order);
                const total = order.reduce((sum, item) => sum + item.price, 0);
                await this.bot.answerCallbackQuery(query.id, { text: `✅ "${name}" tanlandi! Jami: ${total} so'm` });
                this.bot.sendMessage(chatId, `"${name}" buyurtmangizga qo'shildi. Joriy summa: ${total} so'm.`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Yana buyurtma berish", callback_data: 'continue_ordering' }],
                            [{ text: "Buyurtmani ko'rish", callback_data: 'view_order' }],
                            [{ text: "To'lovga o'tish", callback_data: 'checkout' }]
                        ]
                    }
                });
            }
            else if (data === 'checkout') {
                const order = this.userOrders.get(chatId) || [];
                if (order.length === 0) {
                    await this.bot.answerCallbackQuery(query.id, { text: "Buyurtma berilmagan. Avval buyurtma bering." });
                    this.bot.sendMessage(chatId, "Buyurtma berilmagan. Avval menyudan mahsulot tanlang.");
                    return;
                }
                const total = order.reduce((sum, item) => sum + item.price, 0);
                const orderSummary = order.map((o, idx) => `${idx + 1}. ${o.name} - ${o.price} so'm`).join('\n');
                await this.bot.answerCallbackQuery(query.id, { text: "Buyurtmangiz tayyor! To'lovga o'tishingiz mumkin." });
                this.bot.sendMessage(chatId, `🧾 **Sizning buyurtmangiz:**\n${orderSummary}\n\n**💰 Umumiy:** ${total} so'm\n\nBuyurtmani yakunlash uchun pastdagi tugmani bosing:`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: "Buyurtmani tasdiqlash va to'lash", callback_data: 'confirm_payment' }]]
                    }
                });
            }
            else if (data === 'confirm_payment') {
                const order = this.userOrders.get(chatId) || [];
                if (order.length === 0) {
                    await this.bot.answerCallbackQuery(query.id, { text: "Buyurtma mavjud emas." });
                    return;
                }
                const totalAmount = order.reduce((sum, item) => sum + item.price, 0);
                const invoiceTitle = "Fast Food Buyurtmasi";
                const invoiceDescription = order.map(item => `${item.name}`).join(', ');
                const prices = order.map(item => ({ label: item.name, amount: item.price * 100 }));
                await this.bot.answerCallbackQuery(query.id, { text: "To'lov oynasini ochamiz..." });
                this.bot.sendInvoice(chatId, invoiceTitle, invoiceDescription, "fastfood_order", process.env.PAYMENT_PROVIDER_TOKEN, "UZS", prices, {
                    need_phone_number: true,
                    need_shipping_address: true,
                    need_name: true,
                    need_email: false,
                    is_flexible: false,
                }).catch(e => {
                    console.error("Error sending invoice:", e.message);
                    this.bot.sendMessage(chatId, "To'lov xizmatida xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
                });
            }
            else if (data === 'view_order') {
                await this.bot.answerCallbackQuery(query.id);
                const order = this.userOrders.get(chatId) || [];
                if (order.length === 0) {
                    this.bot.sendMessage(chatId, "Sizda hozircha buyurtmalar yo'q.");
                    return;
                }
                const total = order.reduce((sum, item) => sum + item.price, 0);
                const orderList = order.map((item, index) => `${index + 1}. ${item.name} - ${item.price} so'm`).join('\n');
                this.bot.sendMessage(chatId, `🧾 **Mening buyurtmalarim:**\n${orderList}\n\n**💰 Jami:** ${total} so'm`, { parse_mode: 'Markdown' });
            }
            else if (data === 'continue_ordering') {
                await this.bot.answerCallbackQuery(query.id);
                this.bot.sendMessage(chatId, "Yana nimani buyurtma qilasiz?", {
                    reply_markup: {
                        keyboard: [
                            [{ text: "Ichimliklar" }],
                            [{ text: "Yeguliklar" }],
                            [{ text: "Shirinliklar" }],
                            [{ text: "Manzilni yuborish", request_location: true }]
                        ],
                        resize_keyboard: true,
                    },
                });
            }
        });
        this.bot.on('pre_checkout_query', (query) => {
            this.bot.answerPreCheckoutQuery(query.id, true);
        });
        this.bot.on('successful_payment', async (msg) => {
            const chatId = msg.chat.id;
            if (!msg.successful_payment) {
                console.error("Successful payment xabarida successful_payment obyekti topilmadi.");
                return;
            }
            const paymentInfo = msg.successful_payment;
            const totalAmount = paymentInfo.total_amount / 100;
            const order = this.userOrders.get(chatId) || [];
            const orderSummary = order.map(item => item.name).join(', ');
            this.bot.sendMessage(chatId, `✅ To'lovingiz qabul qilindi! Jami: ${totalAmount} so'm. Buyurtmangiz (${orderSummary}) tez orada yetkazib beriladi!`);
            const orderDetails = paymentInfo.order_info;
            const shippingAddress = orderDetails?.shipping_address;
            const userName = orderDetails?.name || 'Nomaʼlum';
            const phoneNumber = orderDetails?.phone_number || 'Nomaʼlum telefon';
            const city = shippingAddress?.city || 'Nomaʼlum shahar';
            const streetLine1 = shippingAddress?.street_line1 || 'Nomaʼlum koʻcha';
            const streetLine2 = shippingAddress?.street_line2 ? `, ${shippingAddress.street_line2}` : '';
            const postCode = shippingAddress?.post_code ? `, Pochta indeksi: ${shippingAddress.post_code}` : '';
            this.bot.sendMessage(this.ownerID, `Yangi to'lov qabul qilindi: ${chatId}, ${userName} dan.\n` +
                `Buyurtma: ${orderSummary}.\n` +
                `Jami: ${totalAmount} so'm.\n` +
                `Manzil: ${city}, ${streetLine1}${streetLine2}${postCode}.\n` +
                `Telefon: ${phoneNumber}`);
            this.userOrders.delete(chatId);
        });
    }
    async sendProducts(chatId, category, products) {
        await this.bot.sendMessage(chatId, `**${category}** bo'limidagi mahsulotlar:`, { parse_mode: 'Markdown' });
        for (const product of products) {
            try {
                await this.bot.sendPhoto(chatId, product.image, {
                    caption: `🍽 **${product.name}**\n💵 ${product.price} so'm\n📝 _${product.description}_`,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                                { text: `🛒 Buyurtma berish (${product.price} so'm)`, callback_data: `buy_${product.name}_${product.price}` }
                            ]]
                    }
                });
            }
            catch (error) {
                console.error(`Error sending photo for ${product.name} from URL: ${product.image}`, error.message);
                await this.bot.sendMessage(chatId, `🍽 **${product.name}**\n💵 ${product.price} so'm\n📝 _${product.description}_\n\n(Rasmni yuklashda xatolik yuz berdi. Iltimos, administratorga murojaat qiling.)`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                                { text: `🛒 Buyurtma berish (${product.price} so'm)`, callback_data: `buy_${product.name}_${product.price}` }
                            ]]
                    }
                });
            }
        }
        this.bot.sendMessage(chatId, `Yuqoridan mahsulot tanlashingiz mumkin.`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Buyurtmani ko'rish", callback_data: 'view_order' }],
                    [{ text: "To'lovga o'tish", callback_data: 'checkout' }],
                    [{ text: "Menyuga qaytish", callback_data: 'continue_ordering' }]
                ]
            }
        });
    }
    async promptForPhoneNumber(chatId, name) {
        const userName = name || 'foydalanuvchi';
        this.bot.sendMessage(chatId, `${userName}, botdan to'liq foydalanish uchun iltimos, telefon raqamingizni jo'natish tugmasini bosing. Raqamingizsiz bot funksiyalaridan foydalana olmaysiz.`, {
            reply_markup: {
                keyboard: [
                    [{ text: "Telefon raqamimni jo'natish", request_contact: true }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        });
    }
    isMessageProcessed(id) {
        return this.processedMessageIds.has(id);
    }
    addProcessedMessage(id) {
        this.processedMessageIds.add(id);
        setTimeout(() => {
            this.processedMessageIds.delete(id);
        }, 10 * 60 * 1000);
    }
    async sendBroadcast(msg) {
        const users = await this.userModel.find({}, 'chatId');
        for (const user of users) {
            const targetChatId = user.chatId;
            if (targetChatId === this.ownerID)
                continue;
            try {
                if (msg.text)
                    await this.bot.sendMessage(targetChatId, msg.text);
                else if (msg.photo)
                    await this.bot.sendPhoto(targetChatId, msg.photo[msg.photo.length - 1].file_id, { caption: msg.caption || '' });
                else if (msg.video)
                    await this.bot.sendVideo(targetChatId, msg.video.file_id, { caption: msg.caption || '' });
                else if (msg.voice)
                    await this.bot.sendVoice(targetChatId, msg.voice.file_id, { caption: msg.caption || '' });
                else if (msg.video_note)
                    await this.bot.sendVideoNote(targetChatId, msg.video_note.file_id);
                else if (msg.contact)
                    await this.bot.sendContact(targetChatId, msg.contact.phone_number, msg.contact.first_name, { last_name: msg.contact.last_name || undefined });
                else if (msg.location)
                    await this.bot.sendLocation(targetChatId, msg.location.latitude, msg.location.longitude);
            }
            catch (error) {
                console.error(`Xabarni ${targetChatId} ga yuborishda xatolik:`, error.message);
                if (error.response && error.response.statusCode === 403) {
                    console.log(`Foydalanuvchi ${targetChatId} botni bloklagan. Ma'lumotlar bazasidan o'chirilmoqda...`);
                    await this.userModel.deleteOne({ chatId: targetChatId });
                }
            }
        }
        this.bot.sendMessage(this.ownerID, "✅ Barcha faol foydalanuvchilarga xabar yuborildi!");
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
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], BotService);
//# sourceMappingURL=bot.service.js.map