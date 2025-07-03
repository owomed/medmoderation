const Discord = require("discord.js");
const db = require("quick.db");
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    name: 'mute',
    aliases: [],
    async execute(client, message, args) {
        if (!message.member.hasPermission('MANAGE_ROLES') && !message.member.roles.cache.some(role => id.Mute.muteyetkilirolid.includes(role.id)) && message.author.id !== ayar.sahip) {
            return message.reply('`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`').then(x => x.delete({ timeout: 3000 }), message.react(id.Emojiler.başarısızemojiid));
        }

        let üye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        let süre = args[1];
        let sebep = args.slice(2).join(' ') || 'Sebep belirtilmemiş';

        if (!üye || !süre) {
            return message.reply('`Mute atabilmek için üye ve süre belirtmelisin!`').then(x => x.delete({ timeout: 3000 }));
        }
        if (üye.roles.cache.has(id.Mute.muterolid)) {
            return message.reply('`Etiketlenen üye zaten muteli!`').then(x => x.delete({ timeout: 3000 }));
        }
        if (message.member.roles.highest.position <= üye.roles.highest.position) {
            return message.reply('`Etiketlediğin kullanıcı senden üst veya senle aynı pozisyonda!`').then(x => x.delete({ timeout: 3000 }));
        }

        let muteSüreleri = {
            '10m': 10 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '20m': 20 * 60 * 1000,
            '30m': 30 * 60 * 1000,
            '1h': 60 * 60 * 1000
        };

        if (!muteSüreleri[süre]) {
            return message.reply('`Geçerli bir süre belirtmelisin! (10m, 15m, 20m, 30m, 1h)`').then(x => x.delete({ timeout: 3000 }));
        }

        let roller = üye.roles.cache;
        db.push(`üye.${üye.id}.sicil`, { Yetkili: message.author.id, Tip: "MUTE", Sebep: sebep, Süre: süre, Zaman: Date.now() });
        db.set(`üye.${üye.id}.roller`, roller.map(role => role.id));

        const embed = new Discord.MessageEmbed()
            .setColor('#1E1F22')
            .setTitle('Kullanıcı Susturuldu')
            .setDescription(`${üye} kişisi \`${süre}\` süresince susturuldu. ${id.Emojiler.başarılıemojiid}`)
            .addFields(
                { name: 'Sebep', value: sebep },
                { name: 'Komutu Kullanan', value: `<@${message.author.id}>`, inline: true },
                { name: 'Kanal', value: `${message.channel}`, inline: true },
                { name: 'Komut', value: `-mute ${üye.id} ${süre}`, inline: true }
            )
            .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        try {
            await üye.roles.add(id.Mute.muterolid); // Mute rolünü ekle
            await message.reply(`\`${üye.user.tag}\` başarıyla susturuldu!`).then(x => x.delete({ timeout: 9000 }), message.react(id.Emojiler.muterolemojiid));

            // Kanala embed mesaj gönder
            await message.channel.send({ embed: embed });

            // Log kanalına embed mesaj gönder
            const logChannel = client.channels.cache.get(id.Mute.mutelogkanalid);
            if (logChannel) {
                await logChannel.send({ embed: embed });
            } else {
                console.error('Log kanalı bulunamadı.');
            }

            // Belirtilen süre sonunda mute kaldırma işlemi
            setTimeout(async () => {
                await üye.roles.remove(id.Mute.muterolid);
                const unmuteEmbed = new Discord.MessageEmbed()
                    .setColor('#1E1F22')
                    .setTitle('Kullanıcının Mutesi Kaldırıldı')
                    .setDescription(`${üye} kişisinin susturulma süresi doldu ve mute kaldırıldı. ${id.Emojiler.başarılıemojiid}`)
                    .addFields(
                        { name: 'Komutu Kullanan', value: `<@${message.author.id}>`, inline: true },
                        { name: 'Kanal', value: `${message.channel}`, inline: true }
                    )
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();

                await message.channel.send({ embed: unmuteEmbed });
                if (logChannel) {
                    await logChannel.send({ embed: unmuteEmbed });
                }
            }, muteSüreleri[süre]);
        } catch (error) {
            console.error('Mute işlemi sırasında bir hata oluştu:', error);
            return message.reply('`Mute işlemi sırasında bir hata oluştu.`').then(x => x.delete({ timeout: 3000 }));
        }
    }
};
