const Discord = require("discord.js");
require('discord-reply'); // Eğer bu modül kullanılmıyorsa kaldırabilirsiniz
const db = require("quick.db");
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    name: 'üstyardım',
    aliases: ['hrhelp'],
    async execute(client, message, args) {
        if (!message.member.roles.cache.some(role => id.Kick.kickyetkiliid.includes(role.id))) {
            return message.lineReply('`Bu komutu kullanmak için gerekli izinlere sahip değilsin!`')
                .then(x => x.delete({ timeout: 3000 }))
                .catch(console.error);
            message.react(id.Emojiler.başarısızemojiid).catch(console.error);
        };

        const embed = new Discord.MessageEmbed()
            .setColor('#93ffb5')
            .setAuthor(`${message.guild.name} Üst Yardım Menüsü`)
            .setDescription(`
            > \`-ban @üye <sebep>\` -> **Üyeyi sunucudan yasaklar.**
            > \`-çek @üye\` -> **Üyeyi bulunduğunuz kanala çekersiniz.**
            > \`-git @üye\` -> **Üyenin bulunduğu ses kanalına gidersiniz.**
            > \`-kick @üye <sebep>\` -> **Üyeyi sunucudan atar.**
            > \`-rol <al/ver> @üye @rol\` -> **Kullanışınıza göre üyeye rol verir veya alır.**
            > \`-rolgöster <id>\` -> **Belirttiğiniz rol ile ilgili bilgiler verir.**
            > \`-unban <id>\` -> **Belirttiğiniz id'nin yasaklamasını kaldırır.**
            > \`-sicil\` -> **Kişinin cezaları hakkında bilgi verir.**
            > \`-ekle\` -> **Sunucuya emoji ekler.**
            > \`-sesdurum\` -> **Kişinin hangi kanalda olduğu hakkında bilgi verir.**
            > \`-siciltemizle\` -> **Kişinin cezalarını temizleyebilirsiniz.**
            <a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350><a:med_cizgi:1375265299355402350>  
                     \`\`\`Daha fazla komut için -help/-yardım kullanabilirsiniz.\`\`\` 
            
            `)
            .setTimestamp()
            .setFooter(`${message.author.tag} kişisi tarafından \`${message.content}\` komutu kullanıldı.`, message.author.displayAvatarURL({ dynamic: true }));

        try {
            await message.channel.send(embed);
        } catch (error) {
            console.error('Mesaj gönderilemedi:', error);
            message.reply('Yardım menüsü gönderilirken bir hata oluştu.').catch(console.error);
        }
    }
};
