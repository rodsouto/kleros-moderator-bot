import * as TelegramBot from "node-telegram-bot-api";
import {CommandCallback} from "../../../types";
import {setGroupGuild} from "../../db";
import {validateUrl} from "./setRules";

/*
 * /setaccount [address]
 */
const regexp = /\/setguild\s?(.+)?/

const callback: CommandCallback = async (bot: TelegramBot, msg: TelegramBot.Message, match: string[]) => {
    const user = await bot.getChatMember(msg.chat.id, String(msg.from.id));

    if (user.status !== 'creator' && user.status !== 'administrator') {
        await bot.sendMessage(msg.chat.id, 'Only admins can execute this command.');
        return;
    }

    if (!msg.reply_to_message) {
        await bot.sendMessage(msg.chat.id, `/setguild must be used in a reply to the guild bot.`);
        return;
    }

    if (validateUrl(match[1])) {
        await setGroupGuild(String(msg.chat.id), 'telegram', String(msg.reply_to_message.from.id), match[1]);
        await bot.sendMessage(msg.chat.id, 'Guild bot set.');
    } else {
        await bot.sendMessage(msg.chat.id, '/setguild must be followed by a valid URL to the guild.');
    }


}

export {regexp, callback};