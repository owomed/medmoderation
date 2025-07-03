const Discord = require('discord.js');

module.exports = {
    name: 'sil',
    description: 'Belirtilen sayıda mesajı siler.',
    async execute(client, message, args) {
        const allowedRoleId = '1236394142788091995'; // Komutu kullanma izni olan rol ID'si
        const logChannelId = '1237313793437204512'; // Log kanalının ID'si

        // Kullanıcı izinlerini kontrol et
        if (!message.member.roles.cache.has(allowedRoleId)) {
            const embed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Yetkisiz Kullanım')
                .setDescription('Bu komutu kullanma izniniz yok. <a:med_hayir:1240942589977559081>')
                .setTimestamp();
            return message.channel.send(embed);
        }

        const amount = parseInt(args[0], 10);
        if (isNaN(amount) || amount < 1 || amount > 500) {
            const embed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Hatalı Giriş')
                .setDescription('Lütfen 1 ile 500 arasında bir sayı girin. <a:med_alert:1235237329799614619>')
                .setTimestamp();
            return message.channel.send(embed);
        }

        let deletedMessages = 0;
        try {
            while (deletedMessages < amount) {
                const deleteCount = Math.min(amount - deletedMessages, 100);
                const deleted = await message.channel.bulkDelete(deleteCount, true);
                deletedMessages += deleted.size;

                if (deleted.size < deleteCount) break;
            }

            const embed = new Discord.MessageEmbed()
                .setColor('#00FF00')
                .setTitle('Mesajlar Silindi')
                .setDescription(`${deletedMessages} mesaj silindi. <a:med_verifyanimated:1235320557747310692>`)
                .setTimestamp();

            message.channel.send(embed).then(msg => {
                setTimeout(() => msg.delete(), 5000);
            }).catch(console.error);

            // Mesaja emoji tepki ekleme
            message.react('🚮');

            // Log kanalına mesaj gönderme
            const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new Discord.MessageEmbed()
                    .setColor('#00FF00')
                    .setTitle('Mesajlar Silindi')
                    .setDescription(`Kanal: ${message.channel.name}\nSilinen mesaj sayısı: ${deletedMessages}`)
                    .setTimestamp()
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
                    .addField('Komutu Kullanan', `<@${message.author.id}>`, true)
                    .addField('Kanal', `${message.channel}`, true)
                    .addField('Komut', `-sil ${amount}`, true);

                logChannel.send(logEmbed);
            }
        } catch (error) {
            console.error('Silme işlemi sırasında bir hata oluştu:', error);
            const embed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Hata')
                .setDescription('Mesajlar silinirken bir hata oluştu.')
                .setTimestamp();
            return message.channel.send(embed);
        }
    }
};
