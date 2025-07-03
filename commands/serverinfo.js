const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'serverinfo',
    aliases: ['server-info', 'guild-info', 'guildinfo'],
    description: 'Sunucu bilgilerini gösterir.',
    async execute(client, message, args) {
        const guild = message.guild;

        if (!guild) {
            return message.reply('Sunucu bilgileri alınırken bir hata oluştu.');
        }

        try {
            const owner = await guild.members.fetch(guild.ownerID);

            const embed = new MessageEmbed()
                .setColor(`#${Math.floor(Math.random() * 16777215).toString(16)}`)
                .setTitle(`${guild.name} Sunucu Bilgileri`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: 'Sunucu ID', value: guild.id },
                    { name: 'Oluşturulma Tarihi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>` },
                    { name: 'Sunucu Sahibi', value: `<@${owner.id}>` },
                    { name: 'Üye Sayısı', value: `${guild.memberCount}` },
                    { name: 'Boost Sayısı', value: `${guild.premiumSubscriptionCount || '0'}` },
                    { name: 'Yazı Kanalları', value: `${guild.channels.cache.filter(c => c.type === 'text').size}` },
                    { name: 'Ses Kanalları', value: `${guild.channels.cache.filter(c => c.type === 'voice').size}` },
                    { name: 'Doğrulama Seviyesi', value: `${guild.verificationLevel}` },
                    { name: 'Roller', value: 'Rol bilgilerini görmek için -serverroles komutunu kullanabilirsiniz.' }
                )
                .setTimestamp()
                .setFooter(`${message.author.tag} kişisi tarafından \`${message.content}\` komutu kullanıldı.`, message.author.displayAvatarURL({ dynamic: true }));

            message.channel.send(embed);
        } catch (error) {
            console.error('Sunucu sahibi bilgisi alınırken bir hata oluştu:', error);
            message.reply('Sunucu bilgileri alınırken bir hata oluştu.');
        }
    }
};
