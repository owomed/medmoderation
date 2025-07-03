const Discord = require("discord.js"),
    client = new Discord.Client();
require('discord-reply');
const db = require("quick.db");
const id = require('../Settings/idler.json')
const ayar = require('../Settings/config.json')

client.on('message', async message => {
    // Eğer mesaj bir link içeriyorsa
    if (message.content.includes('http') || message.content.includes('www')) {
        // Link atan kullanıcının belirli bir role sahip olmadığını kontrol edin
        if (!message.member.roles.cache.has(id.LinkEngelleRolu)) {
            // Mesajı sil
            await message.delete();
            // Uyarı mesajı gönder
            message.channel.send('Bu kanala link gönderemezsin. <a:med_alert:1235237329799614619>')
                .then(msg => msg.delete({ timeout: 2000 }));
        }
    }
});
