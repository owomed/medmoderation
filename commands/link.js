const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const ayar = require('../Settings/config.json');

// Intents'leri ekleyerek botun hangi olayları dinlemesi gerektiğini belirtin
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Mesaj içeriğini okumak için zorunlu intent
    ],
});

client.on('messageCreate', async message => {
    // Botların veya DM'lerin mesajlarını yok say
    if (message.author.bot || message.channel.type === 1) return;

    // Regex ile link tespiti
    const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

    // Eğer mesaj bir link içeriyorsa
    if (linkRegex.test(message.content)) {
        // Kullanıcının "MANAGE_CHANNELS" iznine sahip olup olmadığını kontrol et
        const hasBypassPermission = message.member.permissions.has(PermissionsBitField.Flags.ManageChannels);

        // Eğer kullanıcının izinleri yoksa
        if (!hasBypassPermission) {
            try {
                // Mesajı sil
                await message.delete();
                // Uyarı mesajı gönder
                const reply = await message.channel.send(`Bu kanala link gönderemezsin! <a:med_alert:1235237329799614619>`);
                // Mesajı 5 saniye sonra sil
                setTimeout(() => reply.delete(), 5000);
            } catch (error) {
                console.error('Link engelleme hatası:', error);
            }
        }
    }
});
