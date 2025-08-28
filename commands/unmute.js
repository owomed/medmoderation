const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Bir kullanıcının metin kanallarındaki susturmasını kaldırır.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Susturması kaldırılacak kullanıcı.')
                .setRequired(true)),
    
    // Prefix komut bilgisi
    name: 'unmute',
    aliases: ['susturma-kaldır', 'susturmakaldır'],

    async execute(interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;

        let targetMember;
        if (isSlash) {
            targetMember = interactionOrMessage.options.getMember('kullanıcı');
        } else {
            targetMember = interactionOrMessage.mentions.members.first() || guild.members.cache.get(args[0]);
        }

        // Yetki kontrolü
        const muteYetkilisiRole = id.Mute.muteyetkiliid;
        if (!interactionOrMessage.member.roles.cache.has(muteYetkilisiRole) && !interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.ManageRoles) && author.id !== ayar.sahip) {
            const replyMessage = '`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Kullanıcı ve argüman kontrolü
        if (!targetMember) {
            const replyMessage = '`Metin kanallarından susturmayı kaldırmak için bir üye belirtmelisin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        const muteRoleId = id.Mute.muterolid;
        if (!targetMember.roles.cache.has(muteRoleId)) {
            const replyMessage = '`Etiketlenen üyenin metin kanallarında susturulması bulunmamaktadır!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        if (interactionOrMessage.member.roles.highest.position <= targetMember.roles.highest.position) {
            const replyMessage = '`Etiketlediğin kullanıcı senden üst veya senle aynı pozisyonda!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        try {
            await targetMember.roles.remove(muteRoleId, 'Susturma yetkili tarafından kaldırıldı.');

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Susturma Kaldırıldı')
                .setDescription(`${targetMember} kullanıcısının metin kanallarındaki susturulması başarıyla kaldırıldı.`);
            
            isSlash
                ? await interactionOrMessage.reply({ embeds: [successEmbed] })
                : await interactionOrMessage.reply({ embeds: [successEmbed] }).then(x => setTimeout(() => x.delete(), 9000));

            await interactionOrMessage.react('✅');

            const muteLogChannel = guild.channels.cache.get(id.Mute.mutelogkanalid);
            if (muteLogChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#f4a460')
                    .setTitle('Susturma Kaldırıldı')
                    .addFields(
                        { name: 'Kullanıcı', value: `${targetMember} (\`${targetMember.id}\`)`, inline: true },
                        { name: 'Yetkili', value: `${author} (\`${author.id}\`)`, inline: true }
                    )
                    .setTimestamp();
                muteLogChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Unmute işlemi sırasında bir hata oluştu:', error);
            const errorMessage = '`Susturma kaldırılırken bir hata oluştu.`';
            isSlash
                ? await interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
