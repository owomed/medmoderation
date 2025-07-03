const { MessageEmbed } = require('discord.js');
const id = require('../Settings/idler.json');

module.exports = {
    name: 'isim',
    description: 'Kullanıcının veya başka bir kullanıcının ismini değiştirir.',
    async execute(client, message, args) {
        try {
            if (!message || !message.member) {
                console.error('Komut çalıştırma hatası: Mesaj veya üye bilgisi bulunamadı.');
                return;
            }

            const selfChangeRoles = id.İsim.selfChangeRoles;
            const manageRoles = id.İsim.manageRoles;

            const hasSelfPermission = message.member.roles.cache.some(role => selfChangeRoles.includes(role.id));
            const hasManagePermission = message.member.roles.cache.some(role => manageRoles.includes(role.id));

            if (!hasSelfPermission && !hasManagePermission) {
                return message.channel.send('Bu komutu kullanma izniniz yok. <a:med_hayir:1240942589977559081>');
            }

            const botMember = message.guild.members.cache.get(client.user.id);

            if (!botMember.hasPermission('MANAGE_NICKNAMES')) {
                return message.channel.send('`Botun takma adları yönetme izni yok.`');
            }

            if (hasSelfPermission && !hasManagePermission) {
                const newName = args.join(' ');
                if (!newName) {
                    return message.channel.send('Yeni ismi belirtmeniz gerekiyor. <:med_uzgun:1240760382897786930>');
                }

                await message.member.setNickname(newName);

                const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF3'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                const embed = new MessageEmbed()
                    .setColor(randomColor)
                    .setTitle('İsim Değiştirildi')
                    .setDescription(`İsminiz **${newName}** olarak değiştirildi. <a:zengin_onay:1254372795123503104>`)
                    .setTimestamp();

                message.channel.send(embed);
            } else if (hasManagePermission) {
                const targetMember = message.mentions.members.first();
                const newName = args.slice(1).join(' ');

                if (!targetMember || !newName) {
                    return message.channel.send('Kullanıcıyı etiketlemeniz ve yeni ismi belirtmeniz gerekiyor. <a:med_alert:1235237329799614619>');
                }

                if (botMember.roles.highest.position <= targetMember.roles.highest.position) {
                    return message.channel.send('`Botun rolü, hedef kullanıcının rolünden daha yüksek olmalı.`');
                }

                await targetMember.setNickname(newName);

                const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF3'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                const embed = new MessageEmbed()
                    .setColor(randomColor)
                    .setTitle('İsim Değiştirildi')
                    .setDescription(`${targetMember} kullanıcısının ismi başarıyla **${newName}** olarak değiştirildi. <a:med_onay:1240943849795489812>`)
                    .setTimestamp();

                message.channel.send(embed);
            }
        } catch (error) {
            console.error('İsim değiştirme hatası:', error);
            message.channel.send(`İsim değiştirirken bir hata oluştu: ${error.message}`);
        }
    },
};
