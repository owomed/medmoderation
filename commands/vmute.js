const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
// const db = require('quick.db'); // quick.db kaldırıldı
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
        const client = interactionOrMessage.client; // Mongoose modelleri için client objesi

        let targetMember, reason;
        if (isSlash) {
            targetMember = interactionOrMessage.options.getMember('kullanıcı');
            reason = interactionOrMessage.options.getString('sebep');
        } else {
            targetMember = interactionOrMessage.mentions.members.first() || guild.members.cache.get(args[0]);
            reason = args.slice(1).join(' ');
        }

        // Yetki kontrolü (Aynı kaldı)
        const muteYetkilisiRole = id.Mute.muteyetkiliid;
        if (!interactionOrMessage.member.roles.cache.has(muteYetkilisiRole) && !interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.MuteMembers) && author.id !== ayar.sahip) {
            const replyMessage = '`Bu komutu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        // Argüman ve kullanıcı kontrolleri (Aynı kaldı)
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
            // Ses kanalında kalıcı susturma işlemi (Discord API)
            await targetMember.voice.setMute(true, reason);
            
            // ⭐️ MONGODB (Mongoose) SİCİL KAYDI BAŞLANGIÇ
            const sicilData = {
                Yetkili: author.id,
                Tip: "VOICE MUTE", // Süresiz ses susturması
                Sebep: reason,
                Zaman: Date.now(),
                Süre: "Kalıcı" // Kalıcı olduğunu belirtmek için bu alanı ekliyoruz.
            };
            
            // Eski quick.db: await db.push(`üye.${targetMember.id}.sicil`, sicilData);
            await client.Sicil.findOneAndUpdate(
                { memberId: targetMember.id },
                { $push: { sicil: sicilData } },
                { upsert: true, new: true }
            );
            // ⭐️ MONGODB SİCİL KAYDI BİTİŞ
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Ses Susturma Başarılı')
                .setDescription(`${targetMember} adlı üye **kalıcı olarak** ses kanallarında susturuldu.`)
                .addFields(
                    { name: 'Sebep', value: `\`${reason}\``, inline: true }
                )
                .setTimestamp();

            isSlash
                ? await interactionOrMessage.reply({ embeds: [successEmbed] })
                : await interactionOrMessage.reply({ embeds: [successEmbed] }).then(x => setTimeout(() => x.delete(), 9000));
            
            await interactionOrMessage.react('🔇');

            // Log kanalına gönderim (Aynı kaldı)
            const muteLogChannel = guild.channels.cache.get(id.Mute.mutelogkanalid);
            if (muteLogChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#97ffff')
                    .setTitle('Kalıcı Ses Susturma')
                    .setDescription(`
                        **Kullanıcı:** ${targetMember} (\`${targetMember.id}\`)
                        **Yetkili:** ${author} (\`${author.id}\`)
                        **Sebep:** \`${reason}\`
                        **Süre:** \`Kalıcı\`
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
