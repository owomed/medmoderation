const fetch = require('node-fetch');

module.exports = {
    name: 'ekle',
    description: 'Sunucuya emoji ekler.',
    args: true,
    usage: '<emoji-url> <emoji-name>',
    async execute(client, message, args) {
        // İzin verilen rollerin ID'leri
        const allowedRoleIDs = ['1216094391060529393', '1188389290292551740', '1236317902295138304'];
        // İzin verilen kullanıcı ID'si
        const allowedUserID = '711933653482995817';
        
        // Kullanıcının uygun role sahip olup olmadığını kontrol et
        const hasRolePermission = message.member.roles.cache.some(role => allowedRoleIDs.includes(role.id));
        // Kullanıcının ID'sini kontrol et
        const hasUserPermission = message.author.id === allowedUserID;
        
        // Kullanıcının yetkisi olup olmadığını kontrol et
        if (!hasRolePermission && !hasUserPermission) {
            return message.reply('`Bu komutu kullanma izniniz yok.`');
        }

        // Emoji URL ve ismini al
        const [emojiUrl, ...nameParts] = args;
        const emojiName = nameParts.join(' ').trim();
        if (!emojiUrl || !emojiName) {
            return message.reply('`Lütfen bir emoji URL\'si ve isim girin.`');
        }

        // Emoji ismini geçerli bir formatta kontrol et
        if (emojiName.length < 2 || emojiName.length > 32 || !/^[\w-]+$/.test(emojiName)) {
            return message.reply('`Emoji ismi 2-32 karakter arasında olmalı ve sadece alfanümerik karakterler ve alt çizgi içermelidir.`');
        }

        try {
            // URL'den emoji resmini kontrol et ve fetch ile al
            const response = await fetch(emojiUrl);
            if (!response.ok) {
                throw new Error('Emoji resmi yüklenemedi.');
            }
            const imageBuffer = await response.buffer();

            // Emoji'yi URL'den ekle
            await message.guild.emojis.create(imageBuffer, emojiName);
            message.reply('`Emoji başarıyla eklendi!`');
        } catch (error) {
            console.error('Emoji eklenirken bir hata oluştu:', error);
            message.reply('Emoji eklenirken bir hata oluştu.');
        }
    },
};
