import * as TelegramBot from "node-telegram-bot-api";
import {CommandCallback} from "../../../types";
import {getGuildURL} from "../../db";

/*
 * /getrules
 */
const regexp = /\/getrules/

const callback: CommandCallback = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const guildInviteURL = await getGuildURL(msg.chat.id, 'telegram');
    await bot.sendMessage(msg.chat.id, guildInviteURL || 'No guild found for this chat.');
}

export {regexp, callback};