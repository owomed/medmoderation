const Discord = require('discord.js');

module.exports = {
    name: 'ping',
    aliases: [],
    execute(client, message, args) {
        message.reply('Pong! 🏓 :D').then(sentMessage => {
            const ping = sentMessage.createdTimestamp - message.createdTimestamp;
            const apiPing = Math.round(client.ws.ping);

            const embed = new Discord.MessageEmbed()
                .setColor('#00FF00')
                .setTitle('Bot Ping')
                .addField('Mesaj Gecikmesi', `${ping}ms`, true)
                .addField('API Gecikmesi', `${apiPing}ms`, true)
                .setTimestamp();

            sentMessage.edit('', embed);
        });
    }
};
