const Discord = require('discord.js');

module.exports = {
    name: 'slowmode',
    aliases: ['yavaşmod'],
    description: 'Kanalın yavaş mod süresini ayarlar.',
    async execute(client, message, args) {
        try {
            const allowedRoles = [
                '1236294590626267197',
                '1236314485547860069',
                '1236317902295138304',
                '1188389290292551740',
                '1216094391060529393'
            ]; 

            const hasPermission = message.member.roles.cache.some(role => allowedRoles.includes(role.id));
            if (!hasPermission) {
                const embed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Yetkisiz Kullanım')
                    .setDescription('Bu komutu kullanma izniniz yok. <a:med_hayir:1240942589977559081>')
                    .setTimestamp();
                return message.channel.send(embed);
            }

            const duration = parseInt(args[0], 10);
            if (isNaN(duration) || duration < 0 || duration > 21600) {
                const embed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Hata')
                    .setDescription('Geçerli bir süre belirtmelisiniz (0-21600 saniye arasında). <:uyari:1240750965489930290>')
                    .setTimestamp();
                return message.channel.send(embed);
            }

            await message.channel.setRateLimitPerUser(duration, 'Yavaş mod ayarlandı');

            const successEmbed = new Discord.MessageEmbed()
                .setColor('#00FF00')
                .setTitle('Yavaş Mod Ayarlandı')
                .setDescription(`Kanalın yavaş mod süresi **${duration}** saniye olarak ayarlandı. <a:med_verify_owo:1235316609632043008>`)
                .setTimestamp();

            await message.channel.send(successEmbed);
            
            await message.react('⏲️');
        } catch (error) {
            console.error('Yavaş mod ayarlama hatası:', error);
            message.reply('Yavaş mod ayarlanırken bir hata oluştu.');
        }
    },
};
