const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const idler = require('../Settings/idler.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('sesgir')
        .setDescription('Botu belirli bir ses kanalına bağlar.'),

    // Prefix komut bilgisi
    name: 'sesgir',
    aliases: ['sesgir'],

    async execute(interactionOrMessage) {
        const isSlash = interactionOrMessage.isCommand?.();
        const guild = interactionOrMessage.guild;

        // Botun bağlanacağı kanalın ID'si
        const targetChannelId = '1235643294973956158';
        const targetChannel = guild.channels.cache.get(targetChannelId);

        // Kanal kontrolü ve izinler
        if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) {
            const replyMessage = '`Belirtilen ID\'de geçerli bir ses kanalı bulunamadı.`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 5000));
        }

        const permissions = targetChannel.permissionsFor(guild.members.me);
        if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
            const replyMessage = '`Belirtilen kanala bağlanmak için gerekli izinlere sahip değilim.`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 5000));
        }

        // Eğer bot zaten ses kanalındaysa
        if (guild.members.me.voice.channel) {
            const replyMessage = '`Zaten bir ses kanalına bağlıyım!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 5000));
        }

        try {
            const connection = joinVoiceChannel({
                channelId: targetChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
            });

            await entersState(connection, VoiceConnectionStatus.Ready, 30000);

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`Başarıyla ${targetChannel} ses kanalına bağlandım.`);

            await interactionOrMessage.reply({ embeds: [successEmbed] });
            console.log(`Bot ${targetChannel.name} kanalına bağlandı.`);

        } catch (error) {
            console.error('Ses kanalına bağlanırken bir hata oluştu:', error);
            const errorMessage = '`Ses kanalına bağlanırken bir hata oluştu.`';
            isSlash
                ? await interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 5000));
        }
    }
};
