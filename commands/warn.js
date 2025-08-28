const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('quick.db');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Bir kullanıcıyı uyarır ve siciline kaydeder.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Uyarılacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Uyarı sebebi.')
                .setRequired(true)),

    // Prefix komut bilgisi
    name: 'warn',
    aliases: ['uyar'],

    async execute(interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;

        let targetMember, reason;
        if (isSlash) {
            targetMember = interactionOrMessage.options.getMember('kullanıcı');
            reason = interactionOrMessage.options.getString('sebep');
        } else {
            targetMember = interactionOrMessage.mentions.members.first() || guild.members.cache.get(args[0]);
            reason = args.slice(1).join(' ');
        }

        // Yetki kontrolü (hem rol hem de sunucu izni)
        const warnYetkilisiRole = id.Warn.warnyetkiliid;
        if (!interactionOrMessage.member.roles.cache.has(warnYetkilisiRole) && !interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.Administrator) && author.id !== ayar.sahip) {
            const replyMessage = '`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        // Argüman ve kullanıcı kontrolleri
        if (!targetMember || !reason) {
            const replyMessage = '`Uyarmak için bir üye ve sebep belirtmelisin!`';
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
            await db.push(`üye.${targetMember.id}.uyarılar`, {
                Yetkili: author.id,
                Tip: "WARN",
                Sebep: reason,
                Zaman: Date.now()
            });
            
            // Kullanıcıya DM gönderme
            const dmEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('Sunucu Uyarısı')
                .setDescription(`**${message.guild.name}** sunucusundan ${author} tarafından \`${reason}\` sebebiyle uyarıldın!`)
                .setTimestamp();
            
            targetMember.send({ embeds: [dmEmbed] }).catch(console.error);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Uyarı Başarılı')
                .setDescription(`${targetMember} kullanıcısı başarılı bir şekilde uyarıldı!`);

            isSlash
                ? await interactionOrMessage.reply({ embeds: [successEmbed] })
                : await interactionOrMessage.reply({ embeds: [successEmbed] }).then(x => setTimeout(() => x.delete(), 9000));
            
            await interactionOrMessage.react('⚠️');
            
            // Log kanalına gönderim
            const warnLogChannel = guild.channels.cache.get(id.Warn.warnlogkanalid);
            if (warnLogChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#00ff66')
                    .setTitle('Kullanıcı Uyarıldı')
                    .addFields(
                        { name: 'Kullanıcı', value: `${targetMember} (\`${targetMember.id}\`)`, inline: true },
                        { name: 'Yetkili', value: `${author} (\`${author.id}\`)`, inline: true },
                        { name: 'Sebep', value: `\`${reason}\``, inline: false }
                    )
                    .setTimestamp();
                warnLogChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Warn komutu hatası:', error);
            const errorMessage = '`Kullanıcı uyarılırken bir hata oluştu.`';
            isSlash
                ? await interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
