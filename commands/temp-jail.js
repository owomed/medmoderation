const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const ms = require('ms');
// const db = require('quick.db'); // quick.db kaldırıldı
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('tempjail')
        .setDescription('Bir kullanıcıyı belirtilen süre boyunca geçici olarak jaile atar.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Jaile atılacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('süre')
                .setDescription('Jail süresi (örn: 1m, 1h, 1d).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Jail sebebi.')
                .setRequired(true)),

    // Prefix komut bilgisi
    name: 'tempjail',
    aliases: ['sürelijail', 'süreli-jail', 'temp-jail'],

    async execute(interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;
        const client = interactionOrMessage.client; // Mongoose modelleri için client objesi

        let targetMember, duration, reason;
        if (isSlash) {
            targetMember = interactionOrMessage.options.getMember('kullanıcı');
            duration = interactionOrMessage.options.getString('süre');
            reason = interactionOrMessage.options.getString('sebep');
        } else {
            targetMember = interactionOrMessage.mentions.members.first() || guild.members.cache.get(args[0]);
            duration = args[1];
            reason = args.slice(2).join(' ');
        }

        // Yetki kontrolü (Aynı kaldı)
        const jailYetkilisiRole = id.Jail.jailyetkiliid;
        if (!interactionOrMessage.member.roles.cache.has(jailYetkilisiRole) && !interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.ManageRoles) && author.id !== ayar.sahip) {
            const replyMessage = '`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        // Argüman ve kullanıcı kontrolleri (Aynı kaldı)
        if (!targetMember || !duration || !reason) {
            const replyMessage = '`Jaile atmak için üye, süre(1s,1m,1h,1d) ve sebep belirtmelisin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        const jailRoleId = id.Jail.jailrolid;
        
        if (targetMember.roles.cache.has(jailRoleId)) {
            const replyMessage = '`Etiketlenen üye zaten jailde!`';
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

        const jailLogChannelId = id.Jail.jaillogkanalid;

        try {
            // Kullanıcının mevcut rollerini al (jail rolü hariç)
            const oldRoles = targetMember.roles.cache.filter(r => r.id !== guild.id && r.id !== jailRoleId).map(r => r.id);
            
            // ⭐️ MONGODB (Mongoose) İŞLEMLERİ BAŞLANGIÇ

            // 1. Sicil kaydını ekle (TEMPJAIL tipinde)
            const sicilData = {
                Yetkili: author.id,
                Tip: "TEMPJAIL",
                Sebep: reason,
                Zaman: Date.now(),
                Süre: duration
            };
            // Eski quick.db: db.push(`üye.${targetMember.id}.ssicil`, sicilData);
            await client.Sicil.findOneAndUpdate(
                { memberId: targetMember.id },
                { $push: { sicil: sicilData } },
                { upsert: true, new: true }
            );

            // 2. Kullanıcının eski rollerini kaydet (Askida modeline)
            // Eski quick.db: db.set(`üye.${targetMember.id}.sroller`, oldRoles);
            await client.Askida.findOneAndUpdate(
                { memberId: targetMember.id },
                { 
                    roles: oldRoles, 
                    kaynak: 'JAIL' // Süreli veya süresiz jail için aynı etiketi kullanıyoruz.
                },
                { upsert: true, new: true }
            );

            // ⭐️ MONGODB İŞLEMLERİ BİTİŞ

            // Rol ataması (Aynı kaldı)
            await targetMember.roles.set([jailRoleId]);
            
            // Başarı mesajı (Aynı kaldı)
            const successMessage = `\`${targetMember.user.tag}\` kullanıcısı başarıyla \`${duration}\` boyunca jaile atıldı.`;
            if (isSlash) {
                await interactionOrMessage.reply({ content: successMessage });
            } else {
                await interactionOrMessage.reply(successMessage);
            }

            // Log kanalına gönderim (Aynı kaldı)
            const jailLogChannel = guild.channels.cache.get(jailLogChannelId);
            if (jailLogChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#FF5555')
                    .setTitle('Geçici Jail')
                    .setDescription(`
                        **Kullanıcı:** ${targetMember} (\`${targetMember.id}\`)
                        **Yetkili:** ${author} (\`${author.id}\`)
                        **Sebep:** \`${reason}\`
                        **Süre:** \`${duration}\`
                    `)
                    .setTimestamp();
                jailLogChannel.send({ embeds: [logEmbed] });
            }

            // Jail süresi bittiğinde
            setTimeout(async () => {
                const member = guild.members.cache.get(targetMember.id);
                if (!member || !member.roles.cache.has(jailRoleId)) return; // Üye sunucuda değilse veya jailde değilse işlem yapma

                // ⭐️ MONGODB ROLLBACK İŞLEMLERİ BAŞLANGIÇ

                // Kaydedilmiş rolleri Askida modelinden çek
                // Eski quick.db: const savedRoles = await db.get(`üye.${member.id}.sroller`);
                const askidaData = await client.Askida.findOne({ memberId: member.id, kaynak: 'JAIL' });
                const savedRoles = askidaData ? askidaData.roles : null;

                if (savedRoles && savedRoles.length > 0) {
                    // Kayıtlı roller varsa geri ver ve kaydı sil
                    await member.roles.set(savedRoles);
                    // Eski quick.db: await db.delete(`üye.${member.id}.sroller`);
                    await client.Askida.deleteOne({ memberId: member.id, kaynak: 'JAIL' });
                } else {
                    // Kayıt yoksa sadece jail rolünü kaldır
                    await member.roles.remove(jailRoleId);
                }
                
                // ⭐️ MONGODB ROLLBACK İŞLEMLERİ BİTİŞ

                const unjailEmbed = new EmbedBuilder()
                    .setColor('#55FF55')
                    .setTitle('Geçici Jail Sona Erdi')
                    .setDescription(`${member} kullanıcısının jailliği sona erdi. Otomatik olarak rolleri geri verildi.`);
                
                if (jailLogChannel) {
                    jailLogChannel.send({ embeds: [unjailEmbed] });
                }
            }, ms(duration));

        } catch (error) {
            console.error('Tempjail komutu hatası:', error);
            const errorMessage = '`Kullanıcı jaile atılırken bir hata oluştu.`';
            isSlash
                ? await interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
