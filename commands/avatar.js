const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Etiketlediğiniz kullanıcının profil fotoğrafını gösterir.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Avatarını görmek istediğiniz kullanıcı.')
                .setRequired(false)),

    // Hem slash hem de prefix için çalışacak ana fonksiyon
    async execute(interactionOrMessage) {
        let user;

        // Prefix ve Slash komut ayrımı
        if (interactionOrMessage.isCommand?.()) {
            // Slash komutu için kullanıcıyı al
            user = interactionOrMessage.options.getUser('kullanıcı') || interactionOrMessage.user;
        } else {
            // Prefix komutu için kullanıcıyı al
            // `args` parametresi artık yok, bu yüzden doğrudan mesaj içeriğinden alıyoruz.
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            const target = args[1]; // "!avatar @kullanıcı" gibi bir kullanım için
            
            user = interactionOrMessage.mentions.users.first() || 
                   interactionOrMessage.client.users.cache.get(target) || 
                   (target ? interactionOrMessage.client.users.cache.find(u => u.username.toLowerCase().includes(target.toLowerCase())) : null) || 
                   interactionOrMessage.author;
        }

        // Discord.js v14'te `MessageEmbed` yerine `EmbedBuilder` kullanıyoruz.
        const avatarEmbed = new EmbedBuilder()
            .setColor('#ffac00')
            .setAuthor({ name: `${user.tag} adlı kullanıcının profil fotoğrafı!` })
            .setImage(user.displayAvatarURL({ dynamic: true, format: 'png', size: 1024 }));

        // Yanıt verme şekli
        if (interactionOrMessage.isCommand?.()) {
            await interactionOrMessage.reply({ embeds: [avatarEmbed] });
        } else {
            await interactionOrMessage.reply({ embeds: [avatarEmbed] });
        }
    },

    // Prefix komutu bilgisi
    name: 'avatar',
    description: 'Etiketlediğiniz kullanıcının profil fotoğrafını gösterir.',
    aliases: ['foto'],
};
