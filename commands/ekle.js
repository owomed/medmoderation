const { SlashCommandBuilder } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('ekle')
        .setDescription('Sunucuya emoji ekler.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Emoji resmi URL\'si.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('isim')
                .setDescription('Eklemek istediğiniz emojinin ismi.')
                .setRequired(true)),

    // Hem slash hem de prefix için çalışacak ana fonksiyon
    async execute(interactionOrMessage) {
        // İzin verilen rollerin ve kullanıcının ID'lerini belirle
        const allowedRoleIDs = ['1216094391060529393', '1188389290292551740', '1236317902295138304'];
        const allowedUserID = '711933653482995817';
        
        let emojiUrl, emojiName, author, channel, isSlash;
        
        // Prefix ve Slash komut ayrımı
        if (interactionOrMessage.isCommand?.()) {
            isSlash = true;
            emojiUrl = interactionOrMessage.options.getString('url');
            emojiName = interactionOrMessage.options.getString('isim');
            author = interactionOrMessage.user;
            channel = interactionOrMessage.channel;
        } else {
            isSlash = false;
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            const [url, ...nameParts] = args.slice(1);
            emojiUrl = url;
            emojiName = nameParts.join(' ').trim();
            author = interactionOrMessage.author;
            channel = interactionOrMessage.channel;
        }

        // Yetki kontrolü
        const hasRolePermission = interactionOrMessage.member.roles.cache.some(role => allowedRoleIDs.includes(role.id));
        const hasUserPermission = author.id === allowedUserID;

        if (!hasRolePermission && !hasUserPermission) {
            const replyContent = '`Bu komutu kullanma izniniz yok.`';
            if (isSlash) {
                return interactionOrMessage.reply({ content: replyContent, ephemeral: true });
            } else {
                return interactionOrMessage.reply(replyContent);
            }
        }
        
        // Emoji ismini geçerli bir formatta kontrol et
        if (!emojiName || emojiName.length < 2 || emojiName.length > 32 || !/^[\w-]+$/.test(emojiName)) {
            const replyContent = '`Emoji ismi 2-32 karakter arasında olmalı ve sadece alfanümerik karakterler ve alt çizgi içermelidir.`';
            if (isSlash) {
                return interactionOrMessage.reply({ content: replyContent, ephemeral: true });
            } else {
                return interactionOrMessage.reply(replyContent);
            }
        }

        try {
            await interactionOrMessage.guild.emojis.create({ attachment: emojiUrl, name: emojiName });
            const successContent = '`Emoji başarıyla eklendi!`';
            if (isSlash) {
                await interactionOrMessage.reply({ content: successContent, ephemeral: false });
            } else {
                await interactionOrMessage.reply(successContent);
            }
        } catch (error) {
            console.error('Emoji eklenirken bir hata oluştu:', error);
            const errorContent = `Emoji eklenirken bir hata oluştu: \`${error.message}\``;
            if (isSlash) {
                await interactionOrMessage.reply({ content: errorContent, ephemeral: true });
            } else {
                await interactionOrMessage.reply(errorContent);
            }
        }
    },
    
    // Prefix komutu bilgisi
    name: 'ekle',
    description: 'Sunucuya emoji ekler.',
    aliases: ['addemoji'],
};
