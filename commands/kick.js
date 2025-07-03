const { MessageEmbed } = require('discord.js');
const db = require("quick.db");
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    name: 'kick',
    aliases: [],
    async execute(client, message, args) {
        if (!message.member.hasPermission('KICK_MEMBERS') && !message.member.roles.cache.some(role => id.Kick.kickyetkiliid.includes(role.id)) && message.author.id !== ayar.sahip) {
            return message.lineReply('`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`').then(x => x.delete({ timeout: 3000 }), message.react(id.Emojiler.başarısızemojiid));
        }

        if (!message.guild.me.hasPermission('KICK_MEMBERS')) {
            return message.lineReply('`Botun bu komudu kullanmak için gerekli izinlere sahip değil!`').then(x => x.delete({ timeout: 3000 }));
        }

        let üye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        let sebep = args.slice(1).join(' ');

        if (!üye || !sebep) {
            return message.lineReply('`Sunucudan atabilmek için üye ve sebep belirtmelisin!`').then(x => x.delete({ timeout: 3000 }));
        }
        
        if (!sebep.trim()) {
            return message.lineReply('`Geçerli bir atılma sebebi belirtmelisin!`').then(x => x.delete({ timeout: 3000 }));
        }

        if (message.member.roles.highest.position <= üye.roles.highest.position) {
            return message.lineReply('`Etiketlediğin kullanıcı senden üst veya senle aynı pozisyonda!`').then(x => x.delete({ timeout: 3000 }));
        }

        db.push(`üye.${üye.id}.sicil`, { Yetkili: message.author.id, Tip: "KICK", Sebep: sebep, Zaman: Date.now() });

        try {
            await üye.kick(sebep);

            const embed = new MessageEmbed()
                .setColor('#FFA500')
                .setTitle('Kullanıcı Atıldı')
                .setDescription(`${üye} kişisi sunucudan atıldı.`)
                .setImage('https://c.tenor.com/LHPd4SzpeU8AAAAC/tenor.gif')
                .addField('Sebep', sebep)
                .setTimestamp()
                .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
                .addField('Komutu Kullanan', `<@${message.author.id}>`, true)
                .addField('Komut', `-kick ${üye.id}`, true);

            // Kanala embed mesaj gönder
            await message.lineReply(embed).then(() => message.react(id.Emojiler.başarılıemojiid)).catch(err => {
                console.error('Embed mesajı gönderilirken bir hata oluştu:', err);
            });

            // Log kanalına embed mesaj gönder
            const logChannel = client.channels.cache.get(id.Kick.kicklogkanalid);
            if (logChannel) {
                await logChannel.send({ embed: embed });
            } else {
                console.error('Log kanalı bulunamadı.');
            }
        } catch (error) {
            console.error('Kick işlemi sırasında bir hata oluştu:', error);
            message.lineReply('`Kick işlemi sırasında bir hata oluştu!`').then(x => x.delete({ timeout: 9000 }), message.react(id.Emojiler.başarısızemojiid));
        }
    }
};
