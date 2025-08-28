const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Sunucu hakkında detaylı bilgi verir.'),

    // Prefix komut bilgisi
    name: 'serverinfo',
    aliases: ['server-info', 'guild-info', 'guildinfo', 'si'],
    description: 'Sunucu bilgilerini gösterir.',

    async execute(interactionOrMessage) {
        const guild = interactionOrMessage.guild;
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;

        if (!guild) {
            const replyMessage = 'Sunucu bilgileri alınırken bir hata oluştu.';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage);
        }

        try {
            const owner = await guild.members.fetch(guild.ownerId);

            const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
            const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
            const totalMembers = guild.memberCount;
            const boostedMembers = guild.premiumSubscriptionCount;
            const creationTimestamp = Math.floor(guild.createdTimestamp / 1000);

            const embed = new EmbedBuilder()
                .setColor('Random')
                .setTitle(`${guild.name} Sunucu Bilgileri`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: 'Sunucu ID', value: `\`${guild.id}\``, inline: true },
                    { name: 'Sunucu Sahibi', value: `<@${owner.id}>`, inline: true },
                    { name: 'Oluşturulma Tarihi', value: `<t:${creationTimestamp}:F>`, inline: false },
                    { name: 'Üye Sayısı', value: `\`${totalMembers}\``, inline: true },
                    { name: 'Boost Sayısı', value: `\`${boostedMembers || '0'}\``, inline: true },
                    { name: 'Yazı Kanalları', value: `\`${textChannels}\``, inline: true },
                    { name: 'Ses Kanalları', value: `\`${voiceChannels}\``, inline: true },
                    { name: 'Doğrulama Seviyesi', value: `\`${guild.verificationLevel}\``, inline: true },
                    { name: 'Rol Sayısı', value: `\`${guild.roles.cache.size}\``, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `${author.tag}`, iconURL: author.displayAvatarURL({ dynamic: true }) });

            if (isSlash) {
                await interactionOrMessage.reply({ embeds: [embed] });
            } else {
                await interactionOrMessage.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Sunucu bilgisi alınırken bir hata oluştu:', error);
            const errorMessage = 'Sunucu bilgileri alınırken bir hata oluştu.';
            isSlash
                ? interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : interactionOrMessage.reply(errorMessage);
        }
    }
};
