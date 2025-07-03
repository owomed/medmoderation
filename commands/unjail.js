const Discord = require('discord.js');
const db = require('quick.db');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    name: 'unjail',
    aliases: [],
    async execute(client, message, args) {
        if (!message.member.hasPermission('MANAGE_ROLES') && !message.member.roles.cache.some(role => id.Jail.jailyetkiliid.includes(role.id)) && message.author.id !== ayar.sahip) {
            return message.reply('`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`').then(x => x.delete({ timeout: 3000 }), message.react(id.Emojiler.başarısızemojiid));
        }

        let üye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!üye) {
            return message.reply('`Jailden çıkarabilmek için bir üye belirtmelisin!`').then(x => x.delete({ timeout: 3000 }));
        }

        if (!üye.roles.cache.has(id.Jail.jailrolid)) {
            return message.reply('`Etiketlenen üye jailde bulunmuyor!`').then(x => x.delete({ timeout: 3000 }));
        }

        if (message.member.roles.highest.position <= üye.roles.highest.position) {
            return message.reply('`Etiketlediğin kullanıcı senden üst veya senle aynı pozisyonda!`').then(x => x.delete({ timeout: 3000 }));
        }

        try {
            let roller = db.get(`üye.${üye.id}.roller`) || [];
            await üye.roles.remove(id.Jail.jailrolid);
            
            if (roller.length > 0) {
                for (let roleID of roller) {
                    let role = message.guild.roles.cache.get(roleID);
                    if (role) {
                        await üye.roles.add(role).catch(err => console.error(`Rol eklenirken hata oluştu: ${roleID}`, err));
                    } else {
                        console.error(`Rol bulunamadı: ${roleID}`);
                    }
                }
            }

            db.delete(`üye.${üye.id}.roller`);

            const embed = new Discord.MessageEmbed()
                .setColor('#f4a460')
                .setDescription(`${üye} (\`${üye.id}\`) adlı üye, <@${message.author.id}> (\`${message.author.id}\`) üyesi tarafından ${new Date().toLocaleString("tr-TR")} zamanında jailden çıkarıldı.`);

            const logChannel = client.channels.cache.get(id.Jail.jaillogkanalid);
            if (logChannel) {
                logChannel.send(embed);
            } else {
                console.error('Log kanalı bulunamadı: ', id.Jail.jaillogkanalid);
                throw new Error('Log kanalı bulunamadı.');
            }

            message.reply('`Etiketlenen üye başarıyla jailden çıkarıldı!`').then(x => x.delete({ timeout: 9000 }), message.react(id.Emojiler.başarılıemojiid));
        } catch (error) {
            console.error('Unjail işlemi sırasında bir hata oluştu:', error.message);
            message.reply('`Unjail işlemi sırasında bir hata oluştu: ' + error.message + '`').then(x => x.delete({ timeout: 3000 }));
        }
    }
};
