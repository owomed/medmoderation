const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('çek')
        .setDescription('Bir üyeyi bulunduğunuz sesli kanala çekmek için istek gönderir.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Yanınıza çekmek istediğiniz kişi.')
                .setRequired(true)),

    // Prefix komut bilgisi
    name: 'çek',
    aliases: ['çek'],

    async execute(interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;
        const member = interactionOrMessage.member;

        let targetMember;
        if (isSlash) {
            targetMember = interactionOrMessage.options.getMember('kullanıcı');
        } else {
            targetMember = interactionOrMessage.mentions.members.first() || guild.members.cache.get(args[0]);
        }

        // Ses kanalı kontrolleri
        if (!member.voice.channel || !targetMember || !targetMember.voice.channel || member.voice.channel.id === targetMember.voice.channel.id) {
            const replyMessage = '`Etiketlenen üye veya sen bir ses kanalında değilsin ya da aynı kanaldasınız!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 5000));
        }

        try {
            // Yüksek yetkili ise direkt çekme
            if (member.permissions.has(PermissionsBitField.Flags.Administrator) || member.voice.channel.permissionsFor(member).has(PermissionsBitField.Flags.MoveMembers)) {
                await targetMember.voice.setChannel(member.voice.channel);
                const successEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription(`${targetMember} kullanıcısı başarıyla bulunduğun odaya çekildi.`);
                
                return await interactionOrMessage.reply({ embeds: [successEmbed] });
            }

            // Yüksek yetkisi yoksa onay isteme
            const acceptButton = new ButtonBuilder()
                .setCustomId('pull_accept')
                .setLabel('Kabul Et')
                .setStyle(ButtonStyle.Success);

            const declineButton = new ButtonBuilder()
                .setCustomId('pull_decline')
                .setLabel('Reddet')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder()
                .addComponents(acceptButton, declineButton);

            const confirmationEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setDescription(`${targetMember}, ${author} seni yanına çekmek istiyor. Gitmek ister misin?`);

            const sentMessage = await interactionOrMessage.reply({ 
                content: `${targetMember}`, 
                embeds: [confirmationEmbed], 
                components: [row] 
            });

            const collector = sentMessage.createMessageComponentCollector({ filter: i => i.user.id === targetMember.id, time: 15_000, max: 1 });

            collector.on('collect', async i => {
                if (i.customId === 'pull_accept') {
                    await targetMember.voice.setChannel(member.voice.channel);
                    const finalEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setDescription(`İstek onaylandı! ${targetMember} kullanıcısı ${member} tarafından çekildi.`);
                    await i.update({ embeds: [finalEmbed], components: [] });
                } else if (i.customId === 'pull_decline') {
                    const finalEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription(`İstek reddedildi. ${targetMember} kullanıcısı ${member} tarafından çekilmedi.`);
                    await i.update({ embeds: [finalEmbed], components: [] });
                }
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#FFD700')
                        .setDescription(`İşlem zaman aşımına uğradı. ${targetMember} kullanıcısı yanıt vermedi.`);
                    await sentMessage.edit({ embeds: [timeoutEmbed], components: [] });
                }
            });
        } catch (error) {
            console.error('Çekme işlemi sırasında bir hata oluştu:', error);
            const errorMessage = '`Çekme işlemi sırasında bir hata oluştu.`';
            isSlash
                ? await interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
