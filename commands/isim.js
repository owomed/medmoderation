const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const id = require('../Settings/idler.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('isim')
        .setDescription('Kullanıcının veya kendi takma adınızı değiştirir.')
        .addStringOption(option =>
            option.setName('yeni_isim')
                .setDescription('Ayarlamak istediğiniz yeni takma ad.')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('İsmini değiştirmek istediğiniz kullanıcı. (Boş bırakırsanız kendi isminiz değişir)')
                .setRequired(false)),

    // Hem slash hem de prefix için çalışacak ana fonksiyon
    async execute(interactionOrMessage) {
        let targetUser, newName, author, channel, isSlash;
        
        // Yetki ID'lerini al
        const selfChangeRoles = id.İsim.selfChangeRoles;
        const manageRoles = id.İsim.manageRoles;

        // Komutun prefix mi yoksa slash mı olduğunu kontrol et
        if (interactionOrMessage.isCommand?.()) {
            isSlash = true;
            author = interactionOrMessage.user;
            channel = interactionOrMessage.channel;
            targetUser = interactionOrMessage.options.getMember('kullanıcı');
            newName = interactionOrMessage.options.getString('yeni_isim');
        } else {
            isSlash = false;
            author = interactionOrMessage.author;
            channel = interactionOrMessage.channel;
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            targetUser = interactionOrMessage.mentions.members.first();
            newName = targetUser ? args.slice(2).join(' ') : args.slice(1).join(' ');
        }
        
        const requesterMember = await interactionOrMessage.guild.members.fetch(author.id);
        const botMember = await interactionOrMessage.guild.members.fetch(interactionOrMessage.client.user.id);

        // Yetki kontrolü
        const hasSelfChangePermission = requesterMember.roles.cache.some(role => selfChangeRoles.includes(role.id));
        const hasManagePermission = requesterMember.roles.cache.some(role => manageRoles.includes(role.id));

        if (!hasSelfChangePermission && !hasManagePermission) {
            const replyContent = 'Bu komutu kullanma izniniz yok.';
            return isSlash
                ? interactionOrMessage.reply({ content: replyContent, ephemeral: true })
                : channel.send(replyContent);
        }

        // Botun rol yetkisi kontrolü
        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            const replyContent = '`Botun takma adları yönetme izni yok.`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyContent, ephemeral: true })
                : channel.send(replyContent);
        }
        
        // Komutun kendi ismini değiştirme modunda çalışması
        if (!targetUser) {
            if (!hasSelfChangePermission) {
                const replyContent = '`Kendi isminizi değiştirmek için gerekli yetkiye sahip değilsiniz.`';
                return isSlash
                    ? interactionOrMessage.reply({ content: replyContent, ephemeral: true })
                    : channel.send(replyContent);
            }
            if (!newName) {
                const replyContent = '`Yeni ismi belirtmeniz gerekiyor.`';
                return isSlash
                    ? interactionOrMessage.reply({ content: replyContent, ephemeral: true })
                    : channel.send(replyContent);
            }

            try {
                await requesterMember.setNickname(newName);
                const embed = new EmbedBuilder()
                    .setColor('#00ff00') // Renkleri dinamik oluşturmak yerine sabit bir yeşil tonu
                    .setTitle('İsim Değiştirildi')
                    .setDescription(`İsminiz başarıyla **${newName}** olarak değiştirildi.`);
                
                await isSlash
                    ? interactionOrMessage.reply({ embeds: [embed] })
                    : channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('İsim değiştirme hatası:', error);
                const replyContent = '`İsim değiştirilirken bir hata oluştu.`';
                return isSlash
                    ? interactionOrMessage.reply({ content: replyContent, ephemeral: true })
                    : channel.send(replyContent);
            }
        }
        // Komutun başka bir kullanıcının ismini değiştirme modunda çalışması
        else {
            if (!hasManagePermission) {
                const replyContent = '`Başka bir kullanıcının ismini değiştirmek için gerekli yetkiye sahip değilsiniz.`';
                return isSlash
                    ? interactionOrMessage.reply({ content: replyContent, ephemeral: true })
                    : channel.send(replyContent);
            }
            if (!newName) {
                const replyContent = '`Yeni ismi belirtmeniz gerekiyor.`';
                return isSlash
                    ? interactionOrMessage.reply({ content: replyContent, ephemeral: true })
                    : channel.send(replyContent);
            }
            
            // Botun ve kullanıcının pozisyon kontrolü
            if (botMember.roles.highest.position <= targetUser.roles.highest.position) {
                const replyContent = '`Botun rolü, hedef kullanıcının rolünden daha yüksek olmalı.`';
                return isSlash
                    ? interactionOrMessage.reply({ content: replyContent, ephemeral: true })
                    : channel.send(replyContent);
            }

            try {
                await targetUser.setNickname(newName);
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('İsim Değiştirildi')
                    .setDescription(`${targetUser} kullanıcısının ismi başarıyla **${newName}** olarak değiştirildi.`);
                
                await isSlash
                    ? interactionOrMessage.reply({ embeds: [embed] })
                    : channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('İsim değiştirme hatası:', error);
                const replyContent = '`İsim değiştirilirken bir hata oluştu.`';
                return isSlash
                    ? interactionOrMessage.reply({ content: replyContent, ephemeral: true })
                    : channel.send(replyContent);
            }
        }
    },
    
    // Prefix komutu bilgisi
    name: 'isim',
    description: 'Kullanıcının veya kendi takma adınızı değiştirir.',
    aliases: ['takmaad'],
};
