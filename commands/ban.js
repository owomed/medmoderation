const { SlashCommandBuilder, EmbedBuilder, GuildMember, PermissionsBitField } = require('discord.js');
// const db = require("quick.db"); // quick.db kaldırıldı.
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
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
    async execute(interactionOrMessage) {
        let member, reason, targetId, channel, author, isSlash;
        const client = interactionOrMessage.client;
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

        // Yetki kontrolü (Aynı kaldı)
        const requesterMember = await interactionOrMessage.guild.members.fetch(author.id);
        const hasRolePermission = requesterMember.roles.cache.some(role => banYetkiliRolleri.includes(role.id));
        const isBotOwner = author.id === ayar.sahip;

        if (!hasRolePermission && !isBotOwner) {
            const replyMessage = '`Bu komudu kullanmak için gerekli yetkili role sahip değilsin!`';
            if (isSlash) {
                return interactionOrMessage.reply({ content: replyMessage, ephemeral: true });
            } else {
                return interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
            }
        }

        // Bot yetki kontrolü (Aynı kaldı)
        const botMember = await interactionOrMessage.guild.members.fetch(interactionOrMessage.client.user.id);
        if (!botMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            const replyMessage = '`Botun bu komudu kullanmak için gerekli izinlere sahip değil!`';
            if (isSlash) {
                return interactionOrMessage.reply({ content: replyMessage, ephemeral: true });
            } else {
                return interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
            }
        }

        // Sebep ve hedef kontrolü (Aynı kaldı)
        if (!targetId || !reason) {
            const replyMessage = '`Banlayabilmek için üye veya ID ve sebep belirtmelisin!`';
            if (isSlash) {
                return interactionOrMessage.reply({ content: replyMessage, ephemeral: true });
            } else {
                return interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
            }
        }

        // Pozisyon kontrolü (Aynı kaldı)
        if (member instanceof GuildMember && requesterMember.roles.highest.position <= member.roles.highest.position) {
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

            // ⭐️ MONGODB (Mongoose) SİCİL KAYDI
            const sicilData = {
                Yetkili: author.id,
                Tip: "BAN",
                Sebep: reason,
                Zaman: Date.now()
            };

            // Sicil modelini kullanarak kullanıcının sicil dizisine yeni kaydı ekle
            // upsert: true, eğer kullanıcı kaydı yoksa yeni bir doküman oluşturur.
            await client.Sicil.findOneAndUpdate(
                { memberId: userToBan.id },
                { $push: { sicil: sicilData } },
                { upsert: true, new: true }
            );

            // Log Embed ve Mesajlar (Aynı kaldı)
            const banEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Kullanıcı Yasaklandı')
                .setDescription(`${userToBan.tag || userToBan.username} (\`${userToBan.id}\`) sunucudan yasaklandı.`)
                .setImage('https://c.tenor.com/ai7K4FV5RiEAAAAC/tenor.gif')
                .addFields(
                    { name: 'Sebep', value: reason },
                    { name: 'Yasaklayan Yetkili', value: `<@${author.id}>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `${author.tag}`, iconURL: author.displayAvatarURL({ dynamic: true }) });

            const logChannel = interactionOrMessage.client.channels.cache.get(id.Ban.banlogkanalid);
            if (logChannel) {
                logChannel.send({ embeds: [banEmbed] });
            }

            const successMsg = `\`${userToBan.tag || userToBan.username}\` adlı kullanıcı başarıyla banlandı.`;
            if (isSlash) {
                return interactionOrMessage.reply({ content: successMsg, ephemeral: false });
            } else {
                return interactionOrMessage.reply(successMsg);
            }
        } catch (error) {
            console.error('Komut çalıştırma hatası:', error);
            const replyMessage = '`Bir hata oluştu veya kullanıcı zaten banlanmış olabilir!`';
            if (isSlash) {
                return interactionOrMessage.reply({ content: replyMessage, ephemeral: true });
            } else {
                return interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
            }
        }
    }
};
