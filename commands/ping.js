const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // Slash Command Data
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Botun pingini gösterir.'),

    // Prefix Command Data
    name: 'ping',
    aliases: ['p'],
    description: 'Botun pingini gösterir.',

    async execute(interactionOrMessage) {
        let isSlash = interactionOrMessage.isCommand?.();

        // Send an initial reply to get a starting timestamp
        const initialReply = await interactionOrMessage.reply({ content: 'Ping hesaplanıyor...', fetchReply: true });

        // Calculate message latency (ping)
        const messageLatency = initialReply.createdTimestamp - interactionOrMessage.createdTimestamp;

        // Get API latency directly from the client's WebSocket
        const apiLatency = interactionOrMessage.client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('Pong! 🏓')
            .setDescription('Botun gecikme süreleri aşağıdadır.')
            .addFields(
                { name: 'Mesaj Gecikmesi', value: `\`${messageLatency}ms\``, inline: true },
                { name: 'API Gecikmesi', value: `\`${apiLatency}ms\``, inline: true }
            )
            .setTimestamp();

        if (isSlash) {
            await interactionOrMessage.editReply({ content: null, embeds: [embed] });
        } else {
            await initialReply.edit({ content: null, embeds: [embed] });
        }
    }
};
