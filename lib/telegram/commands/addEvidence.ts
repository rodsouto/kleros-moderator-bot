import * as TelegramBot from "node-telegram-bot-api";
import {CommandCallback} from "../../../types";
import ipfsPublish from "../../ipfs-publish";
import {getRealitioArbitrator} from "../../ethers";
import {getBot} from "../../db";

const processAddEvidence = async (msg: TelegramBot.Message, args: string, privateKey: string): Promise<string> => {
    const enc = new TextEncoder();

    var i = args.indexOf(' ');
    var questionId: string;
    if (i > 0) {
        questionId = args.substring(0, i);
        args = args.substring(i + 1);
    } else {
        questionId = args;
    }

    return processCommand(msg, questionId, privateKey);
}

const processCommand = async (msg: TelegramBot.Message, questionId: number|string, privateKey: string): Promise<string> => {
    const enc = new TextEncoder();
    const author = msg.reply_to_message.from.username || msg.reply_to_message.from.first_name || 'ID: '+msg.reply_to_message.from.id ;
    const fileName = `Message_ChatID_${Math.abs(msg.chat.id)}_Author_${author}_At_${msg.reply_to_message.date}.txt`;
    const chatHistory = `Chat: ${msg.chat.title} (${Math.abs(msg.chat.id)})

Author: ${author} (${(new Date(msg.reply_to_message.date*1000)).toISOString()})

Message: ${msg.reply_to_message.text}`;

    const chatHistoryPath = await ipfsPublish(`${fileName}`, enc.encode(chatHistory));
    const _name = 'Kleros Moderator Bot: Chat History';
    const botAddress = (await getBot(String(msg.chat.id), 'telegram')).address;
    const requester = msg.from.username || msg.from.first_name;
    const _description = `This is an automated message by the Kleros Moderator Bot with address ${botAddress}.
    
    The attached file includes a selected transcript of chat messages.`;

    const evidence = {
        name: _name,
        description: _description,
        fileURI: chatHistoryPath,
      };

      const evidencePath = await ipfsPublish(`evidence.json`, enc.encode(JSON.stringify(evidence)));

    await getRealitioArbitrator(process.env.REALITIO_ARBITRATOR, privateKey)
        .submitEvidence(
            questionId,
            evidencePath
        )

    return evidencePath;
}

/*
 * /addevidence [questionId]
 */
const regexp = /\/addevidence (.+)/

const callback: CommandCallback = async (bot: TelegramBot, msg: TelegramBot.Message, match: string[]) => {

    if (!msg.reply_to_message) {
        await bot.sendMessage(msg.chat.id, `/addevidence must be used in a reply`);
        return;
    }

    if (match.length < 2){
        await bot.sendMessage(msg.chat.id, `/addevidence must be followed by a question id`);
        return; 
    }

    const privateKey = (await getBot(String(msg.chat.id), 'telegram'))?.private_key || false;

    if (!privateKey) {
        await bot.sendMessage(msg.chat.id, `This chat does not have a bot address. Execute /setaccount first.`);
        return;
    }

    const user = await bot.getChatMember(msg.chat.id, String(msg.from.id));

    //if (user.status !== 'creator' && user.status !== 'administrator') {
    //    await bot.sendMessage(msg.chat.id, `Only admins can execute this command.`);
    //    return;
    //}

    try {
        const evidencePath = await processAddEvidence(msg, match[1], privateKey);

        await bot.sendMessage(msg.chat.id, `Evidence submitted: https://ipfs.kleros.io/${evidencePath}`);
    } catch (e) {
        console.log(e);

        await bot.sendMessage(msg.chat.id, `An unexpected error has occurred: ${e.message}. Does the bot address has enough funds to pay the transaction?`);
    }
}

export {regexp, callback, processCommand};