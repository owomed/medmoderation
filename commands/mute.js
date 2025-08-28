const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, GuildMember } = require('discord.js');
const db = require("quick.db");
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Belirtilen kullanıcıyı susturur.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Susturulacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('süre')
                .setDescription('Susturma süresi (örn: 10m, 15m, 1h).')
                .setRequired(true)
                .addChoices(
                    { name: '10 Dakika', value: '10m' },
                    { name: '15 Dakika', value: '15m' },
                    { name: '20 Dakika', value: '20m' },
                    { name: '30 Dakika', value: '30m' },
                    { name: '1 Saat', value: '1h' }
                ))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Susturma sebebi.')
                .setRequired(false)),

    // Hem slash hem de prefix için çalışacak ana fonksiyon
    async execute(interactionOrMessage) {
        let member, duration, reason, author, channel, guild, isSlash;

        // Yetki ID'lerini al
        const muteyetkiliRolleri = id.Mute.muteyetkilirolid;
        const muteRolID = id.Mute.muterolid;
        const botSahipID = ayar.sahip;

        // Komutun prefix mi yoksa slash mı olduğunu kontrol et
        if (interactionOrMessage.isCommand?.()) {
            isSlash = true;
            author = interactionOrMessage.user;
            channel = interactionOrMessage.channel;
            guild = interactionOrMessage.guild;
            member = interactionOrMessage.options.getMember('kullanıcı');
            duration = interactionOrMessage.options.getString('süre');
            reason = interactionOrMessage.options.getString('sebep') || 'Sebep belirtilmemiş';
        } else {
            isSlash = false;
            author = interactionOrMessage.author;
            channel = interactionOrMessage.channel;
            guild = interactionOrMessage.guild;
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            member = interactionOrMessage.mentions.members.first() || interactionOrMessage.guild.members.cache.get(args[1]);
            duration = args[2];
            reason = args.slice(3).join(' ') || 'Sebep belirtilmemiş';
        }
        
        const requesterMember = await guild.members.fetch(author.id);

        // SADECE ROL VE SAHİP KONTROLÜ
        const isAuthorized =
            requesterMember.roles.cache.some(role => muteyetkiliRolleri.includes(role.id)) ||
            author.id === botSahipID;

        if (!isAuthorized) {
            const replyMessage = '`Bu komudu kullanmak için gerekli yetkili role sahip değilsin!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Üye ve süre kontrolü
        if (!member || !duration) {
            const replyMessage = '`Mute atabilmek için üye ve süre belirtmelisin!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        // Mute rolü kontrolü
        if (member.roles.cache.has(muteRolID)) {
            const replyMessage = '`Etiketlenen üye zaten muteli!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Pozisyon kontrolü
        if (requesterMember.roles.highest.position <= member.roles.highest.position) {
            const replyMessage = '`Etiketlediğin kullanıcı senden üst veya senle aynı pozisyonda!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        let muteSüreleri = {
            '10m': 10 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '20m': 20 * 60 * 1000,
            '30m': 30 * 60 * 1000,
            '1h': 60 * 60 * 1000
        };

        if (!muteSüreleri[duration]) {
            const replyMessage = '`Geçerli bir süre belirtmelisin! (10m, 15m, 20m, 30m, 1h)`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        let roller = member.roles.cache;
        db.push(`üye.${member.id}.sicil`, { Yetkili: author.id, Tip: "MUTE", Sebep: reason, Süre: duration, Zaman: Date.now() });
        db.set(`üye.${member.id}.roller`, roller.map(role => role.id));

        const embed = new EmbedBuilder()
            .setColor('#1E1F22')
            .setTitle('Kullanıcı Susturuldu')
            .setDescription(`${member} kişisi \`${duration}\` süresince susturuldu.`)
            .addFields(
                { name: 'Sebep', value: reason },
                { name: 'Komutu Kullanan', value: `<@${author.id}>`, inline: true },
                { name: 'Kanal', value: `${channel}`, inline: true },
                { name: 'Komut', value: `-mute ${member.id} ${duration}`, inline: true }
            )
            .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        try {
            await member.roles.add(muteRolID); // Mute rolünü ekle
            const successMessage = `\`${member.user.tag}\` başarıyla susturuldu!`;
            if (isSlash) {
                await interactionOrMessage.reply({ content: successMessage, embeds: [embed] });
            } else {
                await interactionOrMessage.reply(successMessage).then(() => channel.send({ embeds: [embed] }));
            }

            // Log kanalına embed mesaj gönder
            const logChannel = interactionOrMessage.client.channels.cache.get(id.Mute.mutelogkanalid);
            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
            } else {
                console.error('Log kanalı bulunamadı.');
            }

            // Belirtilen süre sonunda mute kaldırma işlemi
            setTimeout(async () => {
                await member.roles.remove(muteRolID);
                const unmuteEmbed = new EmbedBuilder()
                    .setColor('#1E1F22')
                    .setTitle('Kullanıcının Mutesi Kaldırıldı')
                    .setDescription(`${member} kişisinin susturulma süresi doldu ve mute kaldırıldı.`)
                    .addFields(
                        { name: 'Komutu Kullanan', value: `<@${author.id}>`, inline: true },
                        { name: 'Kanal', value: `${channel}`, inline: true }
                    )
                    .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp();

                await channel.send({ embeds: [unmuteEmbed] });
                if (logChannel) {
                    await logChannel.send({ embeds: [unmuteEmbed] });
                }
            }, muteSüreleri[duration]);
        } catch (error) {
            console.error('Mute işlemi sırasında bir hata oluştu:', error);
            const errorMessage = '`Mute işlemi sırasında bir hata oluştu.`';
            return isSlash
                ? interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    },
    name: 'mute',
    aliases: [],
};
