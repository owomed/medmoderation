const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sil')
        .setDescription('Belirtilen sayıda mesajı siler.')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Silinecek mesaj sayısı (1-500).')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(500)),

    name: 'sil',
    aliases: ['clear', 'temizle', 'delete'],

    async execute(interactionOrMessage) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;
        const channel = interactionOrMessage.channel;

        let amount;
        if (isSlash) {
            amount = interactionOrMessage.options.getInteger('miktar');
        } else {
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            amount = parseInt(args[1], 10);
        }

        // Yetki kontrolü (hem rol hem de sunucu izni)
        const modRole = id.Roles.modYetkilisi;
        if (!interactionOrMessage.member.roles.cache.has(modRole) && !interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.Administrator) && author.id !== ayar.sahip) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Yetkisiz Kullanım')
                .setDescription('`Bu komutu kullanmak için gerekli izinlere sahip değilsin!`');
            return isSlash 
                ? interactionOrMessage.reply({ embeds: [embed], ephemeral: true })
                : interactionOrMessage.reply({ embeds: [embed] }).then(msg => setTimeout(() => msg.delete(), 5000));
        }

        if (isNaN(amount) || amount < 1 || amount > 500) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Hatalı Giriş')
                .setDescription('Lütfen 1 ile 500 arasında bir sayı girin.');
            return isSlash
                ? interactionOrMessage.reply({ embeds: [embed], ephemeral: true })
                : interactionOrMessage.reply({ embeds: [embed] }).then(msg => setTimeout(() => msg.delete(), 5000));
        }

        if (isSlash) {
            await interactionOrMessage.deferReply({ ephemeral: true });
        }

        let deletedMessagesCount = 0;
        try {
            let remaining = amount;
            while (remaining > 0) {
                // Mesajları 100'erli gruplar halinde çek
                const fetchedMessages = await channel.messages.fetch({ limit: Math.min(remaining, 100) });
                if (fetchedMessages.size === 0) break;

                const deletableMessages = fetchedMessages.filter(m => !m.pinned);
                if (deletableMessages.size === 0) break;

                const now = Date.now();
                const twoWeeksAgo = now - 1209600000; // 14 gün milisaniye cinsinden

                // 14 günden yeni mesajları filtrele
                const recentMessages = deletableMessages.filter(m => m.createdTimestamp > twoWeeksAgo);

                // 14 günden eski mesajları filtrele
                const oldMessages = deletableMessages.filter(m => m.createdTimestamp <= twoWeeksAgo);

                // Yeni mesajları toplu olarak sil
                if (recentMessages.size > 0) {
                    const deleted = await channel.bulkDelete(recentMessages, true);
                    deletedMessagesCount += deleted.size;
                    remaining -= deleted.size;
                }

                // Eski mesajları tek tek sil
                for (const msg of oldMessages.values()) {
                    try {
                        await msg.delete();
                        deletedMessagesCount++;
                        remaining--;
                    } catch (err) {
                        console.error(`Mesaj silinemedi ${msg.id}:`, err);
                    }
                }

                // Eğer hiç mesaj silinemezse döngüden çık
                if (recentMessages.size === 0 && oldMessages.size === 0) break;
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Mesajlar Silindi')
                .setDescription(`\`${deletedMessagesCount}\` adet mesaj başarıyla silindi.`)
                .setTimestamp();

            if (isSlash) {
                await interactionOrMessage.editReply({ embeds: [embed] });
                setTimeout(() => interactionOrMessage.deleteReply(), 5000);
            } else {
                await interactionOrMessage.reply({ embeds: [embed] }).then(msg => setTimeout(() => msg.delete(), 5000));
            }

            const logChannel = guild.channels.cache.get(id.LogChannels.modlogkanali);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Mesajlar Silindi')
                    .setDescription(`\`${deletedMessagesCount}\` adet mesaj silindi.`)
                    .addFields(
                        { name: 'Kanal', value: `${channel}`, inline: true },
                        { name: 'Silen', value: `<@${author.id}>`, inline: true }
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Mesajları silerken bir hata oluştu:', error);
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Hata')
                .setDescription('Mesajlar silinirken bir hata oluştu.');
            isSlash
                ? await interactionOrMessage.editReply({ embeds: [embed] })
                : await interactionOrMessage.reply({ embeds: [embed] }).then(msg => setTimeout(() => msg.delete(), 5000));
        }
    }
};
