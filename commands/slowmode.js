const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Kanalın yavaş mod süresini ayarlar.')
        .addIntegerOption(option =>
            option.setName('süre')
                .setDescription('Yavaş mod süresi (saniye). 0 = kapatır.')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600)),

    name: 'slowmode',
    aliases: ['yavaşmod'],

    async execute(interactionOrMessage) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const channel = interactionOrMessage.channel;
        
        let duration;
        if (isSlash) {
            duration = interactionOrMessage.options.getInteger('süre');
        } else {
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            duration = parseInt(args[1], 10);
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
                : interactionOrMessage.reply({ embeds: [embed] });
        }

        if (isNaN(duration) || duration < 0 || duration > 21600) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Hatalı Giriş')
                .setDescription('Lütfen 0 ile 21600 arasında geçerli bir süre girin.');
            return isSlash
                ? interactionOrMessage.reply({ embeds: [embed], ephemeral: true })
                : interactionOrMessage.reply({ embeds: [embed] });
        }

        try {
            await channel.setRateLimitPerUser(duration, 'Yavaş mod ayarlandı');

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Yavaş Mod Ayarlandı')
                .setDescription(`Kanalın yavaş mod süresi **${duration}** saniye olarak ayarlandı.`);

            if (isSlash) {
                await interactionOrMessage.reply({ embeds: [successEmbed] });
            } else {
                await interactionOrMessage.reply({ embeds: [successEmbed] });
            }
            
            await interactionOrMessage.react('⏲️');

        } catch (error) {
            console.error('Yavaş mod ayarlanırken bir hata oluştu:', error);
            const errorMessage = 'Yavaş mod ayarlanırken bir hata oluştu.';
            isSlash
                ? interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : interactionOrMessage.reply(errorMessage);
        }
    },
};
