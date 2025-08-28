const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Kanalın mesaj gönderme iznini kilitler veya açar.')
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Kilitlenecek veya kilidi açılacak kanal.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)),
    
    // Prefix komut bilgisi
    name: 'lock',
    aliases: ['kilit', 'kilitle'],
    description: 'Komutun kullanıldığı kanalı kilitler veya kilidi açar.',

    async execute(interactionOrMessage) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;

        let targetChannel = interactionOrMessage.channel;
        if (isSlash) {
            targetChannel = interactionOrMessage.options.getChannel('kanal') || interactionOrMessage.channel;
        } else if (interactionOrMessage.mentions.channels.first()) {
            targetChannel = interactionOrMessage.mentions.channels.first();
        }

        // Yetki kontrolü (MANAGE_CHANNELS izni veya bot sahibi)
        if (!interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.ManageChannels) && author.id !== ayar.sahip) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Yetkisiz Kullanım')
                .setDescription('`Bu komutu kullanmak için gerekli izinlere sahip değilsin!`');
            return isSlash 
                ? interactionOrMessage.reply({ embeds: [embed], ephemeral: true })
                : interactionOrMessage.reply({ embeds: [embed] });
        }
        
        const everyoneRole = guild.roles.everyone;

        try {
            const currentPerms = targetChannel.permissionsFor(everyoneRole).has(PermissionsBitField.Flags.SendMessages);
            const newPerms = !currentPerms;

            await targetChannel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: newPerms
            });
            
            const action = newPerms ? 'açıldı' : 'kilitlendi';
            const actionEmoji = newPerms ? '🔓' : '🔒';
            const embedColor = newPerms ? '#00FF00' : '#FF0000';
            const embedTitle = newPerms ? 'Kanal Kilidi Açıldı' : 'Kanal Kilitlendi';

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(embedTitle)
                .setDescription(`${targetChannel} kanalı başarıyla ${action}.`);
            
            isSlash
                ? await interactionOrMessage.reply({ embeds: [embed] })
                : await interactionOrMessage.reply({ embeds: [embed] });
            
            await interactionOrMessage.react(actionEmoji);

            // Log kanalına mesaj gönderme
            const logChannel = guild.channels.cache.get(id.LogChannels.modlogkanali); // idler.json'dan çekiyoruz
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setTitle('Kanal Kilit Durumu Değişti')
                    .addFields(
                        { name: 'Kanal', value: `${targetChannel}`, inline: true },
                        { name: 'Durum', value: newPerms ? 'Açıldı' : 'Kilitlendi', inline: true },
                        { name: 'Yetkili', value: `<@${author.id}>`, inline: true }
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Kanal kilitleme/kilidi açma hatası:', error);
            const errorMessage = '`Kanal kilitlenirken veya kilidi açılırken bir hata oluştu.`';
            isSlash
                ? interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : interactionOrMessage.reply(errorMessage);
        }
    },
};
