const Discord = require("discord.js"),
    client = new Discord.Client();
require('discord-reply');
const ms = require("ms");
const db = require("quick.db");
const id = require('../Settings/idler.json')
const ayar = require('../Settings/config.json')
// parsher youtube
module.exports = {
    name: 'çek',
    aliases: [],
    async execute(client, message, args) {

        let üye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!üye) return message.lineReply("`Çekebilmek için bir üye belirtmelisin!`").then(x => x.delete({ timeout: 3000 }));
        if (!message.member.voice.channel || !üye.voice.channel || message.member.voice.channelID == üye.voice.channelID) return message.lineReply('`Etiketlenen üye veya sen seste bulunmamaktasın!`').then(x => x.delete({ timeout: 5000 }));
        if (message.member.hasPermission("ADMINISTRATOR")) { await üye.voice.setChannel(message.member.voice.channelID), message.lineReply('`Üye başarılı bir şekilde bulunduğun odaya çekildi.`').then(x => x.delete({ timeout: 7000 }), message.react(id.Emojiler.başarılıemojiid)); } else {
            const reactionFilter = (reaction, user) => { return ['✅'].includes(reaction.emoji.name) && user.id === üye.id };
            message.channel.send(new Discord.MessageEmbed().setDescription(`${üye}, ${message.author} seni yanına çekmek istiyor. Gitmek istiyor musun?`).setFooter('Onaylamak için 15 saniyen var.')).then(async msj => {
                await msj.react('✅');
                message.channel.send(`${üye}`).then(x => x.delete())
                msj.awaitReactions(reactionFilter, { max: 1, time: 15 * 1000, error: ['time'] }).then(c => {
                    let onay = c.first();
                    if (onay) {
                        üye.voice.setChannel(message.member.voice.channelID);
                        msj.delete(), message.lineReply('`Üye başarılı bir şekilde bulunduğun odaya çekildi.`').then(x => x.delete({ timeout: 7000 }), message.react(id.Emojiler.başarılıemojiid));
                    };
                });
            });
        }
    }
}