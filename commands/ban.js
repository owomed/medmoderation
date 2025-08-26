const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, GuildMember } = require('discord.js');
// quick.db yerine kalıcı bir DB kullanmanızı tavsiye ederim, şimdilik bu şekilde bırakıyorum
const db = require("quick.db"); 
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
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
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers), // Sadece Banlama izni olanlar kullanabilir

    // Hem slash hem de prefix için çalışacak ana fonksiyon
    async execute(interactionOrMessage) {
        let member, reason, targetId, channel, author, isSlash;

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

        // İzin kontrolü
        // `PermissionsBitField.Flags.BanMembers` yerine isterseniz özel rol kontrolü de yapabilirsiniz.
        if (isSlash) {
            if (!interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.BanMembers) && author.id !== ayar.sahip) {
                return interactionOrMessage.reply({ content: '`Bu komutu kullanmak için gerekli izinlere sahip değilsin!`', ephemeral: true });
            }
        } else {
            if (!interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.BanMembers) && !interactionOrMessage.member.roles.cache.some(role => id.Ban.banyetkiliid.includes(role.id)) && author.id !== ayar.sahip) {
                return interactionOrMessage.reply('`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`').then(x => setTimeout(() => x.delete(), 3000));
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
                // ID ile kullanıcıyı al
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

        // Banlama işlemi ve veritabanına kaydetme
        try {
            await interactionOrMessage.guild.members.ban(userToBan.id, { reason: reason });

            // Veri tabanına ekle
            db.push(`üye.${userToBan.id}.sicil`, { Yetkili: author.id, Tip: "BAN", Sebep: reason, Zaman: Date.now() });

            // Embed oluştur
            const banEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Kullanıcı Yasaklandı')
                .setDescription(`${userToBan.tag} (\`${userToBan.id}\`) sunucudan yasaklandı.`)
                .setImage('https://c.tenor.com/ai7K4FV5RiEAAAAC/tenor.gif') // İki farklı gif yerine tek bir sabit gif kullanmak daha pratik
                .addFields(
                    { name: 'Sebep', value: reason },
                    { name: 'Yasaklayan Yetkili', value: `<@${author.id}>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `${author.tag} tarafından`, iconURL: author.displayAvatarURL({ dynamic: true }) });

            // Kullanıcıya ve log kanalına embed gönderme
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
