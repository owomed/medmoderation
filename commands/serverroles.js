const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'serverroles',
    aliases: ['server-roles'],
    description: 'Sunucudaki rolleri ve üye sayılarını gösterir.',
    execute(client, message, args) {
        const guild = message.guild;

        if (!guild) {
            return message.reply('Sunucu bilgileri alınırken bir hata oluştu.');
        }

        guild.members.fetch().then(() => {
            const roles = guild.roles.cache.map(role => {
                const memberCount = role.members.size;
                return {
                    name: role.name,
                    memberCount: memberCount
                };
            });

            roles.sort((a, b) => b.memberCount - a.memberCount);

            const chunkSize = 40; // Her mesajda gösterilecek rol sayısını azaltarak
            const totalChunks = Math.ceil(roles.length / chunkSize);

            for (let i = 0; i < totalChunks; i++) {
                let response = '```\n';
                response += `Sunucuda toplam ${roles.length} rol bulunmaktadır:\n\n`;

                const startIndex = i * chunkSize;
                const endIndex = Math.min(startIndex + chunkSize, roles.length);
                const currentRoles = roles.slice(startIndex, endIndex);

                for (const role of currentRoles) {
                    const roleLine = `Rol Adı: ${role.name} - Üye Sayısı: ${role.memberCount}\n`;
                    if (response.length + roleLine.length + 4 > 2000) {
                        response += '```';
                        message.channel.send(response);
                        response = '```\n';
                    }
                    response += roleLine;
                }

                response += '```';

                message.channel.send(response);
            }
        }).catch(error => {
            console.error('Roller getirilirken bir hata oluştu:', error);
            message.channel.send('Rolleri gösterirken bir hata oluştu.');
        });
    }
};
