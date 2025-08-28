const { SlashCommandBuilder } = require('discord.js');
const db = require("quick.db");
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

        if (isSlash) {
            author = interactionOrMessage.user;
            user = interactionOrMessage.options.getMember('kullanıcı');
        } else {
            author = interactionOrMessage.author;
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
            // Clear the specified keys from the database for the user
            db.delete(`üye.${user.id}.sicil`);
            db.delete(`üye.${user.id}.uyarılar`);
            db.delete(`üye.${user.id}.ssicil`);

            const successMessage = `\`${user.user.tag}\` kullanıcısının sicili başarıyla temizlendi!`;

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
