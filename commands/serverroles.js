const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('serverroles')
        .setDescription('Sunucudaki tüm rolleri ve üye sayılarını gösterir.'),

    // Prefix komut bilgisi
    name: 'serverroles',
    aliases: ['server-roles', 'roles', 'roller'],
    description: 'Sunucudaki rolleri ve üye sayılarını gösterir.',

    async execute(interactionOrMessage) {
        const guild = interactionOrMessage.guild;
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;

        if (!guild) {
            const replyMessage = 'Sunucu bilgileri alınırken bir hata oluştu.';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage);
        }

        try {
            // Tüm üyeleri önbelleğe almak, rollerin üye sayılarını doğru hesaplamak için önemlidir.
            await guild.members.fetch(); 

            const roles = guild.roles.cache
                .filter(role => role.id !== guild.id) // @everyone rolünü hariç tut
                .sort((a, b) => b.position - a.position)
                .map(role => {
                    const memberCount = role.members.size;
                    return `\`${role.name}\`: \`${memberCount}\` üye`;
                });
            
            if (roles.length === 0) {
                const replyMessage = 'Sunucuda @everyone rolü dışında bir rol bulunmuyor.';
                return isSlash 
                    ? interactionOrMessage.reply({ content: replyMessage })
                    : interactionOrMessage.reply(replyMessage);
            }

            const totalRoles = roles.length;
            const roleChunks = [];
            let currentChunk = "";

            roles.forEach(roleLine => {
                if ((currentChunk + roleLine).length > 1024) {
                    roleChunks.push(currentChunk);
                    currentChunk = "";
                }
                currentChunk += (currentChunk === "" ? "" : "\n") + roleLine;
            });
            roleChunks.push(currentChunk);

            const mainEmbed = new EmbedBuilder()
                .setColor('Random')
                .setTitle(`Sunucudaki Roller (${totalRoles} adet)`)
                .setDescription('Aşağıda her bir rol ve sahip olan üye sayısı listelenmiştir.');

            roleChunks.forEach((chunk, index) => {
                mainEmbed.addFields({
                    name: `Rol Listesi ${roleChunks.length > 1 ? `(${index + 1}/${roleChunks.length})` : ''}`,
                    value: chunk
                });
            });

            mainEmbed.setTimestamp()
                .setFooter({ text: `${author.tag}`, iconURL: author.displayAvatarURL({ dynamic: true }) });

            await (isSlash ? interactionOrMessage.reply({ embeds: [mainEmbed] }) : interactionOrMessage.reply({ embeds: [mainEmbed] }));

        } catch (error) {
            console.error('Roller listelenirken bir hata oluştu:', error);
            const errorMessage = 'Roller listelenirken bir hata oluştu.';
            return isSlash 
                ? interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : interactionOrMessage.reply(errorMessage);
        }
    }
};
