const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Bir kullanıcının sunucudaki yasağını kaldırır.')
        .addStringOption(option =>
            option.setName('kullanıcıid')
                .setDescription('Yasağı kaldırılacak kullanıcının ID\'si.')
                .setRequired(true)),

    // Prefix komut bilgisi
    name: 'unban',
    aliases: [],

    async execute(interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;

        let targetId;
        if (isSlash) {
            targetId = interactionOrMessage.options.getString('kullanıcıid');
        } else {
            targetId = args[0];
        }

        // Yetki kontrolü (hem rol hem de sunucu izni)
        const banYetkilisiRole = id.Ban.banyetkiliid;
        if (!interactionOrMessage.member.roles.cache.has(banYetkilisiRole) && !interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.BanMembers) && author.id !== ayar.sahip) {
            const replyMessage = '`Bu komutu kullanmak için gerekli izinlere sahip değilsin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        if (!targetId || isNaN(targetId)) {
            const replyMessage = "`Geçerli bir kullanıcı ID'si belirtmelisin!`";
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        try {
            const bannedUsers = await guild.bans.fetch();
            const bannedUser = bannedUsers.find(ban => ban.user.id === targetId);
            
            if (!bannedUser) {
                const replyMessage = "`Bu ID'ye sahip bir kullanıcı banlanmamış!`";
                return isSlash
                    ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                    : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
            }

            await guild.bans.remove(targetId, `Ban yetkili: ${author.tag}`);

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Yasak Kaldırıldı')
                .setDescription(`\`${bannedUser.user.tag}\` kullanıcısının sunucu yasağı başarıyla kaldırıldı.`);
            
            isSlash
                ? await interactionOrMessage.reply({ embeds: [successEmbed] })
                : await interactionOrMessage.reply({ embeds: [successEmbed] }).then(x => setTimeout(() => x.delete(), 7000));

            await interactionOrMessage.react('✅');

            // Log kanalına gönderim
            const banLogChannel = guild.channels.cache.get(id.Ban.banlogkanalid);
            if (banLogChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#f4a460')
                    .setTitle('Yasak Kaldırıldı')
                    .setDescription(`
                        **Kullanıcı:** \`${bannedUser.user.tag}\` (\`${bannedUser.user.id}\`)
                        **Yetkili:** ${author} (\`${author.id}\`)
                    `)
                    .setTimestamp();
                banLogChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Unban komutu hatası:', error);
            const errorMessage = '`Yasak kaldırılırken bir hata oluştu.`';
            isSlash
                ? await interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
