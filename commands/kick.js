const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, GuildMember } = require('discord.js');
const db = require("quick.db");
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Belirtilen kullanıcıyı sunucudan atar.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Sunucudan atılacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Atılma sebebi.')
                .setRequired(true)),

    // Hem slash hem de prefix için çalışacak ana fonksiyon
    async execute(interactionOrMessage) {
        let member, reason, author, channel, guild, isSlash;

        // Yetki ID'lerini al
        const kickYetkiliRolleri = id.Kick.kickyetkiliid;
        const botSahipID = ayar.sahip;

        // Komutun prefix mi yoksa slash mı olduğunu kontrol et
        if (interactionOrMessage.isCommand?.()) {
            isSlash = true;
            author = interactionOrMessage.user;
            channel = interactionOrMessage.channel;
            guild = interactionOrMessage.guild;
            member = interactionOrMessage.options.getMember('kullanıcı');
            reason = interactionOrMessage.options.getString('sebep');
        } else {
            isSlash = false;
            author = interactionOrMessage.author;
            channel = interactionOrMessage.channel;
            guild = interactionOrMessage.guild;
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            member = interactionOrMessage.mentions.members.first() || interactionOrMessage.guild.members.cache.get(args[1]);
            reason = args.slice(2).join(' ');
        }
        
        const requesterMember = await guild.members.fetch(author.id);
        const botMember = await guild.members.fetch(interactionOrMessage.client.user.id);

        // Yetki Kontrolü
        const isAuthorized =
            requesterMember.permissions.has(PermissionsBitField.Flags.KickMembers) ||
            requesterMember.roles.cache.some(role => kickYetkiliRolleri.includes(role.id)) ||
            author.id === botSahipID;

        if (!isAuthorized) {
            const replyMessage = '`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Botun yetkisi kontrolü
        if (!botMember.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            const replyMessage = '`Botun bu komudu kullanmak için gerekli izinlere sahip değil!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Üye ve sebep kontrolü
        if (!member || !reason || reason.trim().length === 0) {
            const replyMessage = '`Sunucudan atabilmek için üye ve sebep belirtmelisin!`';
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

        // Kick işlemi
        db.push(`üye.${member.id}.sicil`, { Yetkili: author.id, Tip: "KICK", Sebep: reason, Zaman: Date.now() });

        try {
            await member.kick(reason);

            const kickEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('Kullanıcı Sunucudan Atıldı')
                .setDescription(`${member} (\`${member.id}\`) sunucudan atıldı.`)
                .setImage('https://c.tenor.com/LHPd4SzpeU8AAAAC/tenor.gif')
                .addFields(
                    { name: 'Sebep', value: reason },
                    { name: 'Komutu Kullanan', value: `<@${author.id}>`, inline: true },
                    { name: 'Kanal', value: `${channel}`, inline: true },
                    { name: 'Komut', value: `/kick ${member.id}`, inline: true }
                )
                .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            const logChannel = interactionOrMessage.client.channels.cache.get(id.Kick.kicklogkanalid);

            const successMessage = `\`${member.user.tag}\` başarıyla atıldı!`;
            if (isSlash) {
                await interactionOrMessage.reply({ content: successMessage, embeds: [kickEmbed] });
            } else {
                await interactionOrMessage.reply({ embeds: [kickEmbed] }).then(() => interactionOrMessage.react(id.Emojiler.başarılıemojiid));
            }

            if (logChannel) {
                await logChannel.send({ embeds: [kickEmbed] });
            }
        } catch (error) {
            console.error('Kick işlemi sırasında bir hata oluştu:', error);
            const errorMessage = '`Kick işlemi sırasında bir hata oluştu!`';
            return isSlash
                ? interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 9000));
        }
    },
    
    // Prefix komutu bilgisi
    name: 'kick',
    description: 'Belirtilen kullanıcıyı sunucudan atar.',
    aliases: [],
};
