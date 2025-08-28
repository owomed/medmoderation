const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('rolgöster')
        .setDescription('Belirtilen roldeki üyeleri listeler.')
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Listelenecek rol.')
                .setRequired(true)),

    // Prefix komut bilgisi
    name: 'rolgöster',
    aliases: ['rol-göster', "rolgoster", "rol-goster"],

    async execute(interactionOrMessage, args) {
        let isSlash = interactionOrMessage.isCommand?.();
        let role, author, guild;

        if (isSlash) {
            role = interactionOrMessage.options.getRole('rol');
            author = interactionOrMessage.user;
            guild = interactionOrMessage.guild;
        } else {
            role = interactionOrMessage.mentions.roles.first() || interactionOrMessage.guild.roles.cache.get(args[0]);
            author = interactionOrMessage.author;
            guild = interactionOrMessage.guild;
        }

        const yetkiliRolleri = id.Roles.roleyetkiliid; // rolyetkiliid olarak ayar dosyanıza eklediğiniz rol ID'leri
        const requesterMember = await guild.members.fetch(author.id);

        // Yetki kontrolü (Sadece Rol ve Sahip)
        if (!requesterMember.roles.cache.some(r => yetkiliRolleri.includes(r.id)) && author.id !== ayar.sahip) {
            const replyMessage = '`Bu komudu kullanmak için gerekli yetkili role sahip değilsin!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Rol argümanı kontrolü
        if (!role) {
            const replyMessage = '`Rol görüntüleyebilmek için bir rol etiketlemeli veya rol ID\'si girmelisin.`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        try {
            await guild.members.fetch(); // Tüm üyelerin rollerini önbelleğe al
            const membersWithRole = role.members;
            const total = membersWithRole.size;

            if (total === 0) {
                const replyMessage = `\`• ${role.name}\` rolüne sahip hiç kimse bulunamadı.`;
                return isSlash
                    ? interactionOrMessage.reply({ content: replyMessage })
                    : interactionOrMessage.reply(replyMessage);
            }

            // Kullanıcı listesini 1000 karakteri geçmeyecek şekilde parçalara ayırma
            const memberList = membersWithRole.map(member => `<@${member.id}> \`(${member.user.tag})\``).join("\n");
            const chunks = [];
            let currentChunk = "";

            memberList.split("\n").forEach(line => {
                if ((currentChunk + line).length > 1900) { // Discord Embed limiti 4096, field value 1024. Daha güvenli olması için 1900 kullanıldı.
                    chunks.push(currentChunk);
                    currentChunk = "";
                }
                currentChunk += (currentChunk === "" ? "" : "\n") + line;
            });
            chunks.push(currentChunk);

            const mainEmbed = new EmbedBuilder()
                .setColor(role.hexColor === '#000000' ? '#1E1F22' : role.hexColor)
                .setTitle(`\`${role.name}\` Rolüne Sahip Üyeler`)
                .setDescription(`Bu rolde toplam **${total}** üye bulunuyor.`)
                .setTimestamp();

            await interactionOrMessage.reply({ embeds: [mainEmbed] });
            
            // Parçalanmış listeyi ayrı mesajlar olarak gönderme
            for (const chunk of chunks) {
                const chunkEmbed = new EmbedBuilder()
                    .setDescription(chunk);
                    
                await (isSlash ? interactionOrMessage.channel : interactionOrMessage.channel).send({ embeds: [chunkEmbed] });
            }

        } catch (error) {
            console.error('Rol listeleme işlemi sırasında bir hata oluştu:', error);
            const errorMessage = '`Rol listeleme işlemi sırasında bir hata oluştu.`';
            return isSlash
                ? interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
