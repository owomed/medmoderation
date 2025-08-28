const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('yardım')
        .setDescription('Botun tüm komutlarını gösterir.'),
    
    // Prefix komut bilgisi
    name: 'yardım',
    aliases: ['help'],

    async execute(interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;
        
        try {
            const embed = new EmbedBuilder()
                .setColor('#93ffb5')
                .setAuthor({ name: `${guild.name} Yardım Menüsü` })
                .setDescription('Aşağıdan ihtiyacın olan komut kategorisine göz atabilirsin.')
                .addFields(
                    {
                        name: '🔧 Moderasyon Komutları',
                        value: [
                            `\`jail @üye <sebep>\` -> Üyenin tüm rollerini alarak cezalıya atar.`,
                            `\`tempjail @üye <süre> <sebep>\` -> Üyeyi süreli olarak jaile atar.`,
                            `\`unjail @üye\` -> Üyenin cezalılığını kaldırır.`,
                            `\`unmute @üye\` -> Üyenin metin susturmasını açar.`,
                            `\`vmute @üye <sebep>\` -> Üyeyi sesli kanallarda susturur.`,
                            `\`vunmute @üye\` -> Üyenin ses susturmasını kaldırır.`,
                            `\`tempvmute @üye <süre> <sebep>\` -> Üyeyi süreli ses susturması yapar.`,
                            `\`warn @üye <sebep>\` -> Üyeyi özelden uyarır.`,
                            `\`lock\` -> Bulunduğunuz kanalı kilitler veya açar.`,
                            `\`sil <sayı>\` -> Belirtilen sayıda mesajı siler.`
                        ].join('\n'),
                    },
                    {
                        name: '⭐ Kullanıcı ve Sunucu Komutları',
                        value: [
                            `\`avatar [üye]\` -> Avatarınızı veya belirtilen üyenin avatarını gösterir.`,
                            `\`sicil @üye\` -> Kişinin cezaları hakkında bilgi verir.`,
                            `\`ping\` -> Bot ve API gecikmesini gösterir.`,
                            `\`serverinfo\` -> Sunucu hakkında bilgi gösterir.`,
                            `\`serverroles\` -> Sunucu rolleri hakkında bilgi verir.`,
                            `\`isim <yeni isim>\` -> Kendi isminizi değiştirirsiniz.`,
                            `\`isim @üye <yeni isim>\` -> Üyenin ismini değiştirirsiniz.`
                        ].join('\n'),
                    },
                )
                .setTimestamp()
                .setFooter({ text: `${author.tag} tarafından istendi.`, iconURL: author.displayAvatarURL({ dynamic: true }) });
            
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
