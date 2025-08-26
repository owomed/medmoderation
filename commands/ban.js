const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, GuildMember } = require('discord.js');
const db = require("quick.db"); 
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi - artık izin ayarı yok, komut herkese görünür olacak
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Belirtilen kullanıcıyı sunucudan yasaklar.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Yasaklanacak kullanıcı veya kullanıcı ID si.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Yasaklama sebebi.')
                .setRequired(true)),

    // Hem slash hem de prefix için çalışacak ana fonksiyon
    async execute(interactionOrMessage) {
        let member, reason, targetId, channel, author, isSlash;
        const banYetkiliRolleri = id.Ban.banyetkiliid;

        if (interactionOrMessage.isCommand?.()) {
            isSlash = true;
            author = interactionOrMessage.user;
            channel = interactionOrMessage.channel;
            member = interactionOrMessage.options.getMember('kullanıcı');
            reason = interactionOrMessage.options.getString('sebep');
            targetId = interactionOrMessage.options.getUser('kullanıcı').id;
        } else {
            isSlash = false;
            author = interactionOrMessage.author;
            channel = interactionOrMessage.channel;
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            member = interactionOrMessage.mentions.members.first() || interactionOrMessage.guild.members.cache.get(args[1]);
            reason = args.slice(2).join(' ');
            targetId = args[1];
        }

        // Yetki Kontrolü
        const isAuthorized = 
            interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
            interactionOrMessage.member.roles.cache.some(role => banYetkiliRolleri.includes(role.id)) ||
            author.id === ayar.sahip;
        
        if (!isAuthorized) {
            const replyMessage = '`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`';
            if (isSlash) {
                return interactionOrMessage.reply({ content: replyMessage, ephemeral: true });
            } else {
                return interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
            }
        }

        // Sebep ve hedef kontrolü
        if (!targetId || !reason) {
            const replyMessage = '`Banlayabilmek için üye veya ID ve sebep belirtmelisin!`';
            if (isSlash) {
                return interactionOrMessage.reply({ content: replyMessage, ephemeral: true });
            } else {
                return interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
            }
        }

        // Pozisyon kontrolü
        if (member instanceof GuildMember && interactionOrMessage.member.roles.highest.position <= member.roles.highest.position) {
            const replyMessage = '`Etiketlediğin kullanıcı senden üst veya senle aynı pozisyonda!`';
            if (isSlash) {
                return interactionOrMessage.reply({ content: replyMessage, ephemeral: true });
            } else {
                return interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
            }
        }

        let userToBan;
        if (member) {
            userToBan = member;
        } else {
            try {
                userToBan = await interactionOrMessage.client.users.fetch(targetId);
            } catch {
                const replyMessage = '`Geçerli bir kullanıcı veya ID belirtmedin!`';
                if (isSlash) {
                    return interactionOrMessage.reply({ content: replyMessage, ephemeral: true });
                } else {
                    return interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
                }
            }
        }

        try {
            await interactionOrMessage.guild.members.ban(userToBan.id, { reason: reason });

            db.push(`üye.${userToBan.id}.sicil`, { Yetkili: author.id, Tip: "BAN", Sebep: reason, Zaman: Date.now() });

            const banEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Kullanıcı Yasaklandı')
                .setDescription(`${userToBan.tag} (\`${userToBan.id}\`) sunucudan yasaklandı.`)
                .setImage('https://c.tenor.com/ai7K4FV5RiEAAAAC/tenor.gif')
                .addFields(
                    { name: 'Sebep', value: reason },
                    { name: 'Yasaklayan Yetkili', value: `<@${author.id}>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `${author.tag} tarafından`, iconURL: author.displayAvatarURL({ dynamic: true }) });

            const logChannel = interactionOrMessage.client.channels.cache.get(id.Ban.banlogkanalid);

            const successMessage = isSlash ? `\`${userToBan.tag}\` başarıyla yasaklandı!` : `\`${userToBan.tag}\` başarıyla yasaklandı!`;
            if (isSlash) {
                await interactionOrMessage.reply({ content: successMessage, embeds: [banEmbed] });
            } else {
                await interactionOrMessage.reply(successMessage).then(() => channel.send({ embeds: [banEmbed] }));
            }
            
            if (logChannel) {
                await logChannel.send({ embeds: [banEmbed] });
            }

        } catch (error) {
            console.error('Ban işlemi sırasında bir hata oluştu:', error);
            const errorMessage = '`Ban işlemi sırasında bir hata oluştu!`';
            if (isSlash) {
                await interactionOrMessage.reply({ content: errorMessage, ephemeral: true });
            } else {
                await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 9000));
            }
        }
    }
};
