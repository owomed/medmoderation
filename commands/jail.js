const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, GuildMember } = require('discord.js');
const db = require("quick.db"); 
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

    // Hem slash hem de prefix için çalışacak ana fonksiyon
    async execute(interactionOrMessage) {
        let member, reason, author, channel, guild, isSlash;
        
        // Yetkili rol ID'lerini al
        const jailyetkiliRolleri = id.Jail.jailyetkiliid;
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

        // Yetki kontrolü
        const isAuthorized = 
            requesterMember.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
            requesterMember.roles.cache.some(role => jailyetkiliRolleri.includes(role.id)) ||
            author.id === botSahipID;
        
        if (!isAuthorized) {
            const replyMessage = '`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Üye ve sebep kontrolü
        if (!member || !reason) {
            const replyMessage = '`Jaile atabilmek için üye ve sebep belirtmelisin!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Jail rolü kontrolü
        if (member.roles.cache.has(id.Jail.jailrolid)) {
            const replyMessage = '`Etiketlenen üye zaten jailde!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Pozisyon kontrolü
        if (requesterMember.roles.highest.position <= member.roles.highest.position) {
            const replyMessage = '`Etiketlediğin kullanıcı senden üst veya senle aynı pozisyonda!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        // Kullanıcının rollerini kaydetme
        const oldRoles = member.roles.cache.map(role => role.id);
        db.set(`üye.${member.id}.roller`, oldRoles);

        try {
            await member.roles.set([id.Jail.jailrolid]);

            const jailEmbed = new EmbedBuilder()
                .setColor('#1E1F22')
                .setTitle('Kullanıcı Hapse Atıldı')
                .setDescription(`${member} kişisi jaile atıldı. <@&${id.Jail.jailrolid}> rolü verildi.`)
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
