require('dotenv').config()
const ModeratorBot = require('node-telegram-bot-api');
import {getBanRecord, getDisputedBans, setBan} from "./db";
import request from "graphql-request";
import {BigNumber} from "ethers";

(async ()=> {
    const bot = new ModeratorBot(process.env.BOT_TOKEN, {polling: false});

    const bans = {};

    (await getDisputedBans()).forEach((ban) => {
        bans[ban.question_id] = ban;
    });

    const query = `{
  questions(
    where: { 
        id_in: ${JSON.stringify(Object.keys(bans))},
        answer_not: null
    }
  ) {
    id
    answer
    finalize_ts
  }
}`;

    const result = await request(
        'https://api.thegraph.com/subgraphs/name/rodsouto/telegram-moderator-bot',
        query
    )
    for (const question of result.questions) {

        const answer = BigNumber.from(question.answer);

        if (!answer.eq(0) && !answer.eq(1)) {
            // "Invalid" or "Answered too soon"
            // TODO: what should we do?
            continue;
        }

        const latestBanState = answer.toNumber();

        const ban = bans[question.id];
        if (latestBanState !== ban.active) {

            const finalized = question.finalize_ts <= Math.ceil(+new Date() / 1000);

            console.log(
                `${latestBanState ? 'ban' : 'unban'}: ${question.id} for ${ban.app_type} - group ${ban.app_group_id} - user ${ban.app_user_id}`
            );

            if (latestBanState === 1) {
                // ban

                if (ban.app_type === 'telegram') {
                    // @ts-ignore
                    if(finalized == true)
                        await bot.restrictChatMember(ban.app_group_id, ban.app_user_id, {can_send_messages: false});
                     else {
                        await bot.restrictChatMember(ban.app_group_id, ban.app_user_id, {can_send_messages: true});
                        const banHistory = await getBanRecord(ban.app_user_id);
                        // exponential rehibilitation time. 1 day, 7 days, 2 months, 1 year.
                        const rehibilitationTime = 86400 * Math.pow(7,banHistory);
                        const paroleDate = Math. round((new Date()). getTime() / 1000) + rehibilitationTime;
                        // cap at 7 days, permaban after.
                        if (banHistory > 1)
                            await bot.banChatMember(ban.app_group_id, ban.app_user_id);
                        else
                            await bot.banChatMember(ban.app_group_id, ban.app_user_id, {until_date: paroleDate});
                     }
                } else {
                    console.error(`Invalid app_type: ${ban.app_type}`);
                }

                await setBan(question.id, true, finalized);

            } else {
                // unban
                await setBan(question.id, false, finalized);

                if (ban.app_type === 'telegram') {
                    // @ts-ignore
                    await bot.restrictChatMember(msg.chat.id, String(msg.reply_to_message.from.id), {can_send_messages: true});
                } else {
                    console.error(`Invalid app_type: ${ban.app_type}`);
                }
            }
        }
    }
})()