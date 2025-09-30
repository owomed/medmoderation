const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
// const db = require('quick.db'); // quick.db kaldırıldı
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
        const warnYetkilisiRole = id.Warn.warnyetkiliid;
        if (!interactionOrMessage.member.roles.cache.has(warnYetkilisiRole) && !interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.Administrator) && author.id !== ayar.sahip) {
            const replyMessage = '`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        // Argüman ve kullanıcı kontrolleri (Aynı kaldı)
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
            // ⭐️ MONGODB (Mongoose) SİCİL KAYDI BAŞLANGIÇ
            const sicilData = {
                Yetkili: author.id,
                Tip: "WARN", // Uyarı tipi
                Sebep: reason,
                Zaman: Date.now(),
                Süre: "Yok" // Uyarılar genellikle süresizdir.
            };
            
            // Eski quick.db: await db.push(`üye.${targetMember.id}.uyarılar`, sicilData);
            // Uyarı kaydını, Sicil modelindeki sicil dizisine ekliyoruz.
            await client.Sicil.findOneAndUpdate(
                { memberId: targetMember.id },
                { $push: { sicil: sicilData } },
                { upsert: true, new: true }
            );
            // ⭐️ MONGODB SİCİL KAYDI BİTİŞ
            
            // Kullanıcıya DM gönderme
            const dmEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('Sunucu Uyarısı')
                // message.guild.name yerine guild.name kullanıldı
                .setDescription(`**${guild.name}** sunucusundan ${author} tarafından \`${reason}\` sebebiyle uyarıldın!`)
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
            
            // Log kanalına gönderim (Aynı kaldı)
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
