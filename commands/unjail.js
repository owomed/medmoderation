const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('quick.db');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('unjail')
        .setDescription('Bir kullanıcının jailini kaldırır.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Jaili kaldırılacak kullanıcı.')
                .setRequired(true)),
    
    // Prefix komut bilgisi
    name: 'unjail',
    aliases: ['jail-kaldır', 'jailkaldır'],

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
        const jailYetkilisiRole = id.Jail.jailyetkiliid;
        if (!interactionOrMessage.member.roles.cache.has(jailYetkilisiRole) && !interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.ManageRoles) && author.id !== ayar.sahip) {
            const replyMessage = '`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        if (!targetMember) {
            const replyMessage = '`Jailden çıkarabilmek için bir üye belirtmelisin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        if (!targetMember.roles.cache.has(id.Jail.jailrolid)) {
            const replyMessage = '`Etiketlenen üye zaten jailde bulunmuyor!`';
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
            const savedRoles = await db.get(`üye.${targetMember.id}.sroller`);
            if (savedRoles && savedRoles.length > 0) {
                await targetMember.roles.set(savedRoles).catch(err => console.error('Roller geri verilirken hata oluştu:', err));
            } else {
                // Eğer eski roller yoksa, sadece jail rolünü kaldır
                await targetMember.roles.remove(id.Jail.jailrolid).catch(err => console.error('Jail rolü kaldırılırken hata oluştu:', err));
            }
            
            db.delete(`üye.${targetMember.id}.sroller`);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Jail Kaldırıldı')
                .setDescription(`${targetMember} kullanıcısının jailliği başarıyla kaldırıldı.`);

            isSlash
                ? await interactionOrMessage.reply({ embeds: [successEmbed] })
                : await interactionOrMessage.reply({ embeds: [successEmbed] }).then(x => setTimeout(() => x.delete(), 9000));
            
            await interactionOrMessage.react('✅');

            const logChannel = guild.channels.cache.get(id.Jail.jaillogkanalid);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#f4a460')
                    .setTitle('Jail Kaldırıldı')
                    .addFields(
                        { name: 'Kullanıcı', value: `${targetMember} (\`${targetMember.id}\`)`, inline: true },
                        { name: 'Yetkili', value: `${author} (\`${author.id}\`)`, inline: true }
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Unjail işlemi sırasında bir hata oluştu:', error);
            const errorMessage = '`Unjail işlemi sırasında bir hata oluştu.`';
            isSlash
                ? await interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
