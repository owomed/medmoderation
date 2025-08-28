const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ],
});

// Botunuzun bulunduğu sunucunun ve ses kanalının ID'lerini buraya ekleyin
const guildId = 'SUNUCU_IDNIZI_BURAYA_GIRIN'; // Örnek: '123456789012345678'
const channelId = 'SES_KANALI_IDNIZI_BURAYA_GIRIN'; // Örnek: '1235643294973956158'

client.once('ready', async () => {
    console.log(`Bot hazır: ${client.user.tag}`);

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        console.error('Hata: Belirtilen sunucu ID\'siyle sunucu bulunamadı.');
        return;
    }

    const voiceChannel = guild.channels.cache.get(channelId);
    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
        console.error('Hata: Belirtilen ses kanalı ID\'si geçersiz veya bulunamadı.');
        return;
    }

    const permissions = voiceChannel.permissionsFor(client.user);
    if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
        console.error('Hata: Ses kanalına bağlanmak veya konuşmak için gerekli izinlere sahip değilim.');
        return;
    }

    try {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        console.log('Başarıyla ses kanalına katıldı!');
    } catch (error) {
        console.error('Ses kanalına katılırken bir hata oluştu:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
