const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, GuildMember } = require('discord.js');
// const db = require("quick.db"); // quick.db kaldırıldı.
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('jail')
        .setDescription('Belirtilen kullanıcıyı jaile atar.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Jaile atılacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Jail sebebi.')
                .setRequired(true)),

    async execute(interactionOrMessage) {
        let member, reason, author, channel, guild, isSlash;
        const client = interactionOrMessage.client;
        
        // Yetkili rol ID'lerini al
        const jailyetkiliRolleri = id.Jail.jailyetkiliid;
        const jailRolID = id.Jail.jailrolid;
        const botSahipID = ayar.sahip;

        // Komutun prefix mi yoksa slash mı olduğunu kontrol et
        if (interactionOrMessage.isCommand?.()) {
            isSlash = true;
            author = interactionOrMessage.user;
            channel = interactionOrMessage.channel;
            guild = interactionOrMessage.guild;
            member = interactionOrMessage.options.getMember('kullanıcı');
            reason = interactionOrMessage.options.getString('sebep');
        } else {
            isSlash = false;
            author = interactionOrMessage.author;
            channel = interactionOrMessage.channel;
            guild = interactionOrMessage.guild;
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            member = interactionOrMessage.mentions.members.first() || interactionOrMessage.guild.members.cache.get(args[1]);
            reason = args.slice(2).join(' ');
        }
        
        const requesterMember = await guild.members.fetch(author.id);

        // SADECE ROL VE SAHİP KONTROLÜ (Aynı Kaldı)
        const isAuthorized =
            requesterMember.roles.cache.some(role => jailyetkiliRolleri.includes(role.id)) ||
            author.id === botSahipID;
        
        if (!isAuthorized) {
            const replyMessage = '`Bu komudu kullanmak için gerekli yetkili role sahip değilsin!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Üye ve sebep kontrolü (Aynı Kaldı)
        if (!member || !reason) {
            const replyMessage = '`Jaile atabilmek için üye ve sebep belirtmelisin!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Jail rolü kontrolü (Aynı Kaldı)
        if (member.roles.cache.has(jailRolID)) {
            const replyMessage = '`Etiketlenen üye zaten jailde!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Pozisyon kontrolü (Aynı Kaldı)
        if (requesterMember.roles.highest.position <= member.roles.highest.position) {
            const replyMessage = '`Etiketlediğin kullanıcı senden üst veya senle aynı pozisyonda!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        // ⭐️ MONGODB (Mongoose) İŞLEMLERİ BAŞLANGIÇ

        // 1. Kullanıcının rollerini al ve kaydet
        const oldRoles = member.roles.cache
            .filter(r => r.id !== guild.id) // @everyone rolünü hariç tut
            .map(role => role.id);
            
        try {
            // Roller Mongoose'daki Askida modeline kaydediliyor (Çünkü Askıda modeli, rolleri depolamak için tasarlanmıştı)
            // Eski quick.db: db.set(`üye.${member.id}.roller`, oldRoles);
            await client.Askida.findOneAndUpdate(
                { memberId: member.id },
                { roles: oldRoles },
                { upsert: true, new: true }
            );

            // 2. Kullanıcının tüm rollerini silip jail rolünü ver
            await member.roles.set([jailRolID]);
            
            // 3. Sicil kaydını ekle (Tıpkı ban komutunda yaptığımız gibi)
            const sicilData = {
                Yetkili: author.id,
                Tip: "JAIL", // Sicil tipi: JAIL
                Sebep: reason,
                Zaman: Date.now()
            };

            await client.Sicil.findOneAndUpdate(
                { memberId: member.id },
                { $push: { sicil: sicilData } },
                { upsert: true, new: true }
            );

            // ⭐️ MONGODB İŞLEMLERİ BİTİŞ
            
            const jailEmbed = new EmbedBuilder()
                .setColor('#1E1F22')
                .setTitle('Kullanıcı Hapse Atıldı')
                .setDescription(`${member} kişisi jaile atıldı. <@&${jailRolID}> rolü verildi.`)
                .addFields(
                    { name: 'Sebep', value: reason },
                    { name: 'Komutu Kullanan', value: `<@${author.id}>`, inline: true },
                    { name: 'Kanal', value: `${channel}`, inline: true },
                    { name: 'Komut', value: `/jail ${member.user.id}`, inline: true }
                )
                .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            const logChannel = client.channels.cache.get(id.Jail.jaillogkanalid);

            const successMessage = `\`${member.user.tag}\` başarıyla jaile atıldı!`;
            if (isSlash) {
                await interactionOrMessage.reply({ content: successMessage, embeds: [jailEmbed] });
            } else {
                await interactionOrMessage.reply(successMessage).then(() => channel.send({ embeds: [jailEmbed] }));
            }

            if (logChannel) {
                await logChannel.send({ embeds: [jailEmbed] });
            }
        } catch (error) {
            console.error('Jail işlemi sırasında bir hata oluştu:', error);
            const errorMessage = '`Jail işlemi sırasında bir hata oluştu.`';
            return isSlash
                ? interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
