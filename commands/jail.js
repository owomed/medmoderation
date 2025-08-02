const Discord = require("discord.js");
const db = require("quick.db");
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    name: 'jail',
    aliases: [],
    async execute(client, message, args) {
        if (!message.member.hasPermission('MANAGE_ROLES') && !message.member.roles.cache.some(role => id.Jail.jailyetkiliid.includes(role.id)) && message.author.id !== ayar.sahip) {
            return message.reply('`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`').then(x => x.delete({ timeout: 3000 }), message.react(id.Emojiler.başarısızemojiid));
        }

        let üye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        let sebep = args.slice(1).join(' ');

        if (!üye || !sebep) {
            return message.reply('`Jaile atabilmek için üye ve sebep belirtmelisin!`').then(x => x.delete({ timeout: 3000 }));
        }
        if (üye.roles.cache.has(id.Jail.jailrolid)) {
            return message.reply('`Etiketlenen üye zaten jailde!`').then(x => x.delete({ timeout: 3000 }));
        }
        if (message.member.roles.highest.position <= üye.roles.highest.position) {
            return message.reply('`Etiketlediğin kullanıcı senden üst veya senle aynı pozisyonda!`').then(x => x.delete({ timeout: 3000 }));
        }

        let roller = üye.roles.cache;
        db.set(`üye.${üye.id}.roller`, roller.map(role => role.id)); // Kullanıcının rollerini kaydet
        
        const embed = new Discord.MessageEmbed()
            .setColor('#1E1F22')
            .setTitle('Kullanıcı Hapse Atıldı')
            .setDescription(`${üye} kişisine <@&${id.Jail.jailrolid}> rolü verildi ve hapsedildi. ${id.Emojiler.başarılıemojiid}`)
            .addFields(
                { name: 'Sebep', value: sebep },
                { name: 'Komutu Kullanan', value: `<@${message.author.id}>`, inline: true },
                { name: 'Kanal', value: `${message.channel}`, inline: true },
                { name: 'Komut', value: `-jail ${üye.id}`, inline: true }
            )
            .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        try {
            await üye.roles.set([id.Jail.jailrolid]); // Jail rolünü ekle, diğer tüm rolleri kaldır
            
            // Kanala mesaj gönder
            await message.reply(`\`${üye.user.tag}\` başarıyla jaile atıldı!`).then(x => x.delete({ timeout: 9000 }), message.react(id.Emojiler.başarılıemojiid));
            
            // Kanala embed mesaj gönder
            await message.channel.send({ embed: embed });
            
            // Log kanalına embed mesaj gönder
            const logChannel = client.channels.cache.get(id.Jail.jaillogkanalid);
            if (logChannel) {
                await logChannel.send({ embed: embed });
            } else {
                console.error('Log kanalı bulunamadı.');
            }
        } catch (error) {
            console.error('Jail işlemi sırasında bir hata oluştu:', error);
            return message.reply('`Jail işlemi sırasında bir hata oluştu.`').then(x => x.delete({ timeout: 3000 }));
        }
    }
};
