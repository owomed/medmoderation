const Discord = require('discord.js');

module.exports = {
    name: 'lock',
    description: 'Komutun kullanıldığı kanalı kilitler veya kilidi açar.',
    async execute(client, message, args) {
        const allowedRoles = [
            '1236314485547860069',
            '1236317902295138304',
            '1188389290292551740',
            '1216094391060529393'
        ]; // Komutu kullanma izni olan rol ID'leri
        const logChannelId = '833691259222360165'; // Log kanalının ID'si

        const hasPermission = message.member.roles.cache.some(role => allowedRoles.includes(role.id));
        if (!hasPermission) {
            const embed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Yetkisiz Kullanım')
                .setDescription('`Bu komutu kullanma izniniz yok.` <a:med_hayir:1240942589977559081>')
                .setTimestamp();
            return message.channel.send(embed);
        }

        const everyoneRole = message.guild.roles.everyone;
        const currentChannel = message.channel;

        const isLocked = !currentChannel.permissionsFor(everyoneRole).has('SEND_MESSAGES');

        try {
            if (isLocked) {
                await currentChannel.updateOverwrite(everyoneRole, { SEND_MESSAGES: true });

                const embed = new Discord.MessageEmbed()
                    .setColor('#00FF00')
                    .setTitle('Kanal Kilidi Açıldı')
                    .setDescription(`${currentChannel} kanalı başarıyla açıldı. <a:med_onay:1240943849795489812>`)
                    .setTimestamp();

                message.channel.send(embed);
                message.react('🔓');

                // Log kanalına mesaj gönderme
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    logChannel.send(embed);
                }
            } else {
                await currentChannel.updateOverwrite(everyoneRole, { SEND_MESSAGES: false });

                const embed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Kanal Kilitlendi')
                    .setDescription(`${currentChannel} kanalı başarıyla kilitlendi. <a:med_onay:1240943849795489812>`)
                    .setTimestamp();

                message.channel.send(embed);
                message.react('🔒');

                // Log kanalına mesaj gönderme
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    logChannel.send(embed);
                }
            }
        } catch (error) {
            console.error('Kanal kilitleme/kilidi açma hatası:', error);
            message.reply('`Kanal kilitlenirken veya kilidi açılırken bir hata oluştu.`');
        }
    },
};
