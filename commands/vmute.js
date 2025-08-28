const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('quick.db');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('vmute')
        .setDescription('Bir kullanıcıyı ses kanallarında kalıcı olarak susturur.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Susturulacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Susturma sebebi.')
                .setRequired(true)),
    
    // Prefix komut bilgisi
    name: 'vmute',
    aliases: ['seslisustur'],

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
        const muteYetkilisiRole = id.Mute.muteyetkiliid;
        if (!interactionOrMessage.member.roles.cache.has(muteYetkilisiRole) && !interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.MuteMembers) && author.id !== ayar.sahip) {
            const replyMessage = '`Bu komutu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        // Argüman ve kullanıcı kontrolleri
        if (!targetMember || !reason) {
            const replyMessage = '`Ses kanallarında susturmak için üye ve sebep belirtmelisin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        if (!targetMember.voice.channel) {
            const replyMessage = '`Üye ses kanalında bulunmamaktadır!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        if (targetMember.voice.mute) {
            const replyMessage = '`Etiketlenen kullanıcı zaten ses kanallarında susturulmuş!`';
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
            await targetMember.voice.setMute(true, reason);
            
            // Veritabanı işlemleri
            await db.push(`üye.${targetMember.id}.sicil`, {
                Yetkili: author.id,
                Tip: "VOICE MUTE",
                Sebep: reason,
                Zaman: Date.now()
            });
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Ses Susturma Başarılı')
                .setDescription(`${targetMember} adlı üye başarıyla ses kanallarında susturuldu.`)
                .addFields(
                    { name: 'Sebep', value: `\`${reason}\``, inline: true }
                )
                .setTimestamp();

            isSlash
                ? await interactionOrMessage.reply({ embeds: [successEmbed] })
                : await interactionOrMessage.reply({ embeds: [successEmbed] }).then(x => setTimeout(() => x.delete(), 9000));
            
            await interactionOrMessage.react('🔇');

            // Log kanalına gönderim
            const muteLogChannel = guild.channels.cache.get(id.Mute.mutelogkanalid);
            if (muteLogChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#97ffff')
                    .setTitle('Ses Susturma')
                    .setDescription(`
                        **Kullanıcı:** ${targetMember} (\`${targetMember.id}\`)
                        **Yetkili:** ${author} (\`${author.id}\`)
                        **Sebep:** \`${reason}\`
                    `)
                    .setTimestamp();
                muteLogChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.error('vmute komutu hatası:', error);
            const errorMessage = '`Kullanıcı ses kanalında susturulurken bir hata oluştu.`';
            isSlash
                ? await interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
