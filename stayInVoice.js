const { Client, Intents } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
});

const channelId = '1235643294973956158'; // Ses kanalının ID'sini buraya ekleyin

client.once('ready', async () => {
    console.log(`Bot hazır: ${client.user.tag}`);

    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error('Sunucu bulunamadı.');
        return;
    }

    const voiceChannel = guild.channels.cache.get(channelId);
    if (!voiceChannel) {
        console.error('Ses kanalı bulunamadı.');
        return;
    }

    try {
        const connection = await voiceChannel.join();
        console.log('Ses kanalına katıldı.');
    } catch (error) {
        console.error('Ses kanalına katılma hatası:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
