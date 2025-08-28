const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const idler = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('yetkileri-al')
        .setDescription('Etiketlenen kişiden yetkili rollerini alır. (Sadece bot sahibi)')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Yetkileri alınacak kişi.')
                .setRequired(true)),

    // Prefix komut bilgisi
    name: 'yetkileri-al',
    aliases: ['yetkilerial', 'aletykileri'],

    async execute(interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;

        // Bot sahibi kontrolü
        if (author.id !== ayar.sahip) {
            const replyMessage = '`Bu komutu sadece bot sahibi kullanabilir!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        let targetMember;
        if (isSlash) {
            targetMember = interactionOrMessage.options.getMember('kullanıcı');
        } else {
            targetMember = interactionOrMessage.mentions.members.first() || guild.members.cache.get(args[0]);
        }

        if (!targetMember) {
            const replyMessage = '`Lütfen yetkilerini almak istediğiniz kişiyi etiketleyin.`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        const yetkiliRolleri = idler.yetkililerinhepsi;
        const alinanRoller = targetMember.roles.cache.filter(role => yetkiliRolleri.includes(role.id));

        if (alinanRoller.size === 0) {
            const replyMessage = '`Bu kişide alınacak yetkili rol bulunamadı.`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        try {
            await targetMember.roles.remove(alinanRoller);

            const successEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Yetkiler Alındı')
                .setDescription(`${targetMember} kullanıcısından yetkili rolleri başarıyla alındı.`)
                .addFields(
                    { name: 'İşlem Yapan', value: `${author}`, inline: true },
                    { name: 'Alınan Roller', value: alinanRoller.map(role => `${role.name}`).join(', ') || 'Yok', inline: true }
                )
                .setTimestamp();

            await interactionOrMessage.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Yetki alırken bir hata oluştu:', error);
            const errorMessage = '`Rolleri alırken bir hata oluştu.`';
            isSlash
                ? await interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
