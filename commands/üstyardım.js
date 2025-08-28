const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('üstyardım')
        .setDescription('Üst düzey yetkili komutlarını gösterir.'),
    
    // Prefix komut bilgisi
    name: 'üstyardım',
    aliases: ['hrhelp'],

    async execute(interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isCommand?.();
        const member = interactionOrMessage.member;
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;

        // Yetki kontrolü
        const kickYetkiliIDs = Array.isArray(id.Kick.kickyetkiliid) ? id.Kick.kickyetkiliid : [id.Kick.kickyetkiliid];
        if (!member.roles.cache.some(role => kickYetkiliIDs.includes(role.id))) {
            const replyMessage = '`Bu komutu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        try {
            const embed = new EmbedBuilder()
                .setColor('#93ffb5')
                .setAuthor({ name: `${guild.name} Üst Yardım Menüsü` })
                .setDescription('Aşağıda üst düzey yetkililere özel komutlar listelenmiştir.')
                .addFields(
                    {
                        name: '🔨 Yönetim Komutları',
                        value: [
                            `\`ban @üye <sebep>\` -> Üyeyi sunucudan yasaklar.`,
                            `\`kick @üye <sebep>\` -> Üyeyi sunucudan atar.`,
                            `\`unban <id>\` -> Belirttiğiniz ID'nin yasağını kaldırır.`,
                            `\`siciltemizle @üye\` -> Kişinin tüm cezalarını temizler.`,
                        ].join('\n'),
                    },
                    {
                        name: '🛠️ Yardımcı Komutlar',
                        value: [
                            `\`çek @üye\` -> Üyeyi bulunduğunuz kanala çekersiniz.`,
                            `\`git @üye\` -> Üyenin bulunduğu ses kanalına gidersiniz.`,
                            `\`rol <al/ver> @üye @rol\` -> Üyeye rol verir veya rol alır.`,
                            `\`rolgöster <id>\` -> Belirttiğiniz rol ile ilgili bilgi verir.`,
                            `\`sesdurum @üye\` -> Kişinin hangi kanalda olduğu hakkında bilgi verir.`,
                            `\`sicil @üye\` -> Kişinin cezaları hakkında bilgi verir.`,
                            `\`ekle <url>\` -> Sunucuya emoji ekler.`
                        ].join('\n'),
                    },
                )
                .setTimestamp()
                .setFooter({ text: `${author.tag} tarafından istendi. | Daha fazla komut için -yardım yazabilirsiniz.`, iconURL: author.displayAvatarURL({ dynamic: true }) });

            // Komut türüne göre yanıt gönder
            isSlash
                ? await interactionOrMessage.reply({ embeds: [embed] })
                : await interactionOrMessage.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Yardım menüsü gönderilirken bir hata oluştu:', error);
            const errorMessage = '`Yardım menüsü gönderilirken bir hata oluştu.`';
            isSlash
                ? await interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
