const Discord = require("discord.js");
require('discord-reply');
const db = require("quick.db");
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    name: 'yardım',
    aliases: ['help'],
    async execute(client, message, args) {
        const embed = new Discord.MessageEmbed()
            .setColor('#93ffb5')
            .setAuthor(`${message.guild.name} Yardım Menüsü`)
            .setDescription(`
            > \`-avatar\` -> **Avatarınızı gösterir.**
            > \`-jail @üye <sebep>\` -> **Üyenin tüm rollerini alarak cezalıya atar.**
            > \`-mute @üye <süre>\` -> **Üyeyi metin kanallarında susturur.**
            > \`-lock\` -> **Bulunduğunuz kanalı kapatır veya açar.**
            > \`-tempjail @üye <süre> <sebep>\` -> **Üyeyi süreli bir şekilde tüm rollerini alarak jaile atar.**
            > \`-tempvmute @üye <süre> <sebep>\` -> **Üyeyi ses kanallarında süreli susturur.**
            > \`-unjail @üye\` -> **Üyeyi cezalıdan çıkararak eski rollerini geri verir.**
            > \`-unmute @üye\` -> **Üyenin metin kanallarındaki susturmasını açar.**
            > \`-vmute @üye <sebep>\` -> **Üyeyi sesli kanallarda susturur.**
            > \`-vunmute @üye\` -> **Üyenin sesli kanallardaki susturmasını kaldırır.**
            > \`-warn @üye <sebep>\` -> **Üyeyi özelden uyarır.**
            > \`-isim @üye <yeni isim>\` -> **Üyenin ismini değiştirir.** __Yetkililer için__
            > \`-isim <yeni isim>\` -> **Kendi isminizi değiştirirsiniz.** __Booster, Donor vb için__
            > \`-ping\` -> **Bot ve API gecikmesini gösterir.**
            > \`-serverinfo\` -> **Server ile ilgili bilgileri gösterir.**
            > \`-serverroles\` -> **Server rolleri hakkında bilgi verir.**
            > \`-sil\` -> **Belirtilen sayıda mesajı siler.**
            > \`-slowmode\` -> **Kanalın yavaş mod süresini ayarlar.**
            > \`-sicil\` -> **Kişinin cezaları hakkında bilgi verir.**
            `)
            .setTimestamp()
            .setFooter(`${message.author.tag} kişisi tarafından \`${message.content}\` komutu kullanıldı.`, message.author.displayAvatarURL({ dynamic: true }));

        try {
            await message.channel.send(embed);
        } catch (error) {
            console.error('Mesaj gönderilemedi:', error);
            message.reply('Yardım menüsü gönderilirken bir hata oluştu.');
        }
    }
};
