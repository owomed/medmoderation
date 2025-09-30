const { SlashCommandBuilder } = require('discord.js');
// const db = require("quick.db"); // quick.db kaldırıldı
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash command data
    data: new SlashCommandBuilder()
        .setName('sicil-temizle')
        .setDescription('Belirtilen üyenin sicilini veritabanından temizler.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Sicili temizlenecek kullanıcı.')
                .setRequired(true)),

    // Prefix command info
    name: 'sicil-temizle',
    aliases: ['siciltemizle'],
    
    async execute(interactionOrMessage, args) {
        let isSlash = interactionOrMessage.isCommand?.();
        let user, author;
        const client = interactionOrMessage.client; // Client objesini al

        if (isSlash) {
            author = interactionOrMessage.user;
            user = interactionOrMessage.options.getMember('kullanıcı');
        } else {
            author = interactionOrMessage.author;
            // Prefix komutlarında args[0] yerine args kullanın
            user = interactionOrMessage.mentions.members.first() || interactionOrMessage.guild.members.cache.get(args[0]);
        }
        
        // Permission check (only the bot owner can use this command)
        if (author.id !== ayar.sahip) {
            const replyMessage = '`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // User check
        if (!user) {
            const replyMessage = '`Sicil temizleyebilmek için bir üye belirtmelisin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        try {
            // ⭐️ MONGODB SİCİL TEMİZLEME İŞLEMLERİ
            
            // 1. Ana Sicil Kaydını Sil (medkayit.siciller koleksiyonu)
            // Bu, 'üye.ID.sicil', 'üye.ID.uyarılar', 'üye.ID.ssicil' gibi tüm sicil kayıtlarının karşılığıdır.
            const sicilResult = await client.Sicil.deleteOne({ memberId: user.id });

            // 2. Askıdaki Rol Kaydını Sil (Mute/Jail Rollback verileri - medkayit.siciller_ve_askidakiler koleksiyonu)
            // Eğer kullanıcı şu anda jail'de veya askıdaysa, bu kaydı da silmeliyiz ki sicil silinince rolleri geri verme denemesi yapmasın.
            const askidaResult = await client.Askida.deleteOne({ memberId: user.id });

            // Kontrol amaçlı:
            if (sicilResult.deletedCount === 0 && askidaResult.deletedCount === 0) {
                 const notFoundMessage = `\`${user.user.tag}\` kullanıcısının sicili veya askıda kaydı bulunamadı.`;
                 return isSlash
                    ? await interactionOrMessage.reply({ content: notFoundMessage })
                    : await interactionOrMessage.reply(notFoundMessage);
            }

            const successMessage = `\`${user.user.tag}\` kullanıcısının sicili ve askıdaki rolleri başarıyla temizlendi!`;

            isSlash
                ? await interactionOrMessage.reply({ content: successMessage })
                : await interactionOrMessage.reply(successMessage);

        } catch (error) {
            console.error('Sicil temizleme işlemi sırasında bir hata oluştu:', error);
            const errorMessage = '`Sicil temizleme işlemi sırasında bir hata oluştu.`';
            isSlash 
                ? interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
