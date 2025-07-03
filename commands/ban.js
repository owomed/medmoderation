const { MessageEmbed } = require('discord.js');
const db = require("quick.db");
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    name: 'ban',
    aliases: ['yasakla'],
    async execute(client, message, args) {
        if (!message.member.hasPermission('BAN_MEMBERS') && !message.member.roles.cache.some(role => id.Ban.banyetkiliid.includes(role.id)) && message.author.id !== ayar.sahip) {
            return message.lineReply('`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`').then(x => x.delete({ timeout: 3000 }), message.react(id.Emojiler.başarısızemojiid));
        }

        let üye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        let sebep = args.slice(1).join(' ');

        if (!üye && !args[0]) {
            return message.lineReply('`Banlayabilmek için üye veya ID ve sebep belirtmelisin!`').then(x => x.delete({ timeout: 3000 }));
        }

        if (!sebep) {
            return message.lineReply('`Banlayabilmek için sebep belirtmelisin!`').then(x => x.delete({ timeout: 3000 }));
        }

        
        let gifUrl = üye ? 'https://c.tenor.com/ai7K4FV5RiEAAAAC/tenor.gif' : 'https://c.tenor.com/DAk9RZTDFSwAAAAC/tenor.gif';

        // Eğer üye sunucuda değilse veya ID ile ban yapılacaksa
        if (!üye) {
            try {
                // Sunucuda olmayan ID ile kullanıcıyı banla
                await message.guild.members.ban(args[0], { reason: sebep });

                // Veri tabanına ekle
                db.push(`üye.${args[0]}.sicil`, { Yetkili: message.author.id, Tip: "BAN", Sebep: sebep, Zaman: Date.now() });

                // Başarı mesajı ve embed oluştur
                const embed = new MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Kullanıcı Yasaklandı')
                    .setDescription(`ID'si ${args[0]} olan kullanıcı sunucudan yasaklandı.`)
                    .setImage(gifUrl)
                    .addField('Sebep', sebep)
                    .setTimestamp()
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
                    .addField('Komutu Kullanan', `<@${message.author.id}>`, true)
                    .addField('Komut', `-ban ${args[0]} ${sebep}`, true);

                // Embed mesajı kanala gönder
                await message.lineReply('`Belirtilen ID başarıyla banlandı!`').then(x => x.delete({ timeout: 9000 }), message.react(id.Emojiler.başarılıemojiid));
                await message.channel.send({ embed: embed });

                // Log kanalına embed mesajı gönder
                const logChannel = client.channels.cache.get(id.Ban.banlogkanalid);
                if (logChannel) {
                    await logChannel.send({ embed: embed });
                } else {
                    console.error('Log kanalı bulunamadı.');
                }
            } catch (error) {
                console.error('ID ile ban işlemi sırasında bir hata oluştu:', error);
                return message.lineReply('`ID ile ban işlemi sırasında bir hata oluştu!`').then(x => x.delete({ timeout: 9000 }), message.react(id.Emojiler.başarısızemojiid));
            }
        } else {
            // Sunucuda olan kullanıcıyı banla
            if (message.member.roles.highest.position <= üye.roles.highest.position) {
                return message.lineReply('`Etiketlediğin kullanıcı senden üst veya senle aynı pozisyonda!`').then(x => x.delete({ timeout: 3000 }));
            }

            db.push(`üye.${üye.id}.sicil`, { Yetkili: message.author.id, Tip: "BAN", Sebep: sebep, Zaman: Date.now() });

            try {
                await message.guild.members.ban(üye, { reason: sebep });

                const embed = new MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Kullanıcı Yasaklandı')
                    .setDescription(`ID'si ${üye.id} olan kullanıcı sunucudan yasaklandı.`)
                    .setImage(gifUrl)
                    .addField('Sebep', sebep)
                    .setTimestamp()
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
                    .addField('Komutu Kullanan', `<@${message.author.id}>`, true)
                    .addField('Komut', `-ban ${üye.id} ${sebep}`, true);

                // Embed mesajı kanala gönder
                await message.lineReply('`Etiketlenen üye başarıyla banlandı!`').then(x => x.delete({ timeout: 9000 }), message.react(id.Emojiler.başarılıemojiid));
                await message.channel.send({ embed: embed });

                // Log kanalına embed mesajı gönder
                const logChannel = client.channels.cache.get(id.Ban.banlogkanalid);
                if (logChannel) {
                    await logChannel.send({ embed: embed });
                } else {
                    console.error('Log kanalı bulunamadı.');
                }
            } catch (error) {
                console.error('Ban işlemi sırasında bir hata oluştu:', error);
                return message.lineReply('`Ban işlemi sırasında bir hata oluştu!`').then(x => x.delete({ timeout: 9000 }), message.react(id.Emojiler.başarısızemojiid));
            }
        }
    }
};
