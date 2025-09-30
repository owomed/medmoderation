const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
// const db = require('quick.db'); // quick.db kaldırıldı
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

    async execute(interactionOrMessage) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;
        const client = interactionOrMessage.client; // Mongoose modelleri için client objesi

        let targetMember;
        if (isSlash) {
            targetMember = interactionOrMessage.options.getMember('kullanıcı');
        } else {
            // Prefix komutunda targetMember'ı almanın yolu, interactionOrMessage'daki args'ı kullanmaktır.
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            targetMember = interactionOrMessage.mentions.members.first() || guild.members.cache.get(args[1]);
        }

        // Yetki kontrolü (Aynı kaldı)
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

        const jailRoleId = id.Jail.jailrolid;

        if (!targetMember.roles.cache.has(jailRoleId)) {
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
            // ⭐️ MONGODB (Mongoose) İŞLEMLERİ BAŞLANGIÇ

            // 1. Kaydedilmiş rolleri Askida modelinden çek (kaynak: 'JAIL' olanları)
            // Eski quick.db: const savedRoles = await db.get(`üye.${targetMember.id}.sroller`);
            const askidaData = await client.Askida.findOne({ memberId: targetMember.id, kaynak: 'JAIL' });
            const savedRoles = askidaData ? askidaData.roles : null;

            if (savedRoles && savedRoles.length > 0) {
                // Kayıtlı roller varsa geri ver
                // Hata yakalama (catch) ekliyoruz, çünkü bu işlem yetki sorunları nedeniyle hata verebilir.
                await targetMember.roles.set(savedRoles).catch(err => console.error('Roller geri verilirken hata oluştu:', err));
            } else {
                // Kayıt yoksa, sadece jail rolünü kaldır
                await targetMember.roles.remove(jailRoleId).catch(err => console.error('Jail rolü kaldırılırken hata oluştu:', err));
            }
            
            // 2. Askıdaki rol kaydını sil
            // Eski quick.db: db.delete(`üye.${targetMember.id}.sroller`);
            await client.Askida.deleteOne({ memberId: targetMember.id, kaynak: 'JAIL' });
            
            // ⭐️ MONGODB (Mongoose) İŞLEMLERİ BİTİŞ

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Jail Kaldırıldı')
                .setDescription(`${targetMember} kullanıcısının jailliği başarıyla kaldırıldı ve eski rolleri geri verildi.`);

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
