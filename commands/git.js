const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const id = require('../Settings/idler.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('git')
        .setDescription('Belirtilen kullanıcının yanına sesli kanalda gider.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Yanına gitmek istediğiniz kullanıcı.')
                .setRequired(true)),

    // Hem slash hem de prefix için çalışacak ana fonksiyon
    async execute(interactionOrMessage) {
        let member, author, channel, guild, isSlash;
        
        // Komutun prefix mi yoksa slash mı olduğunu kontrol et
        if (interactionOrMessage.isCommand?.()) {
            isSlash = true;
            author = interactionOrMessage.user;
            member = interactionOrMessage.options.getMember('kullanıcı');
            channel = interactionOrMessage.channel;
            guild = interactionOrMessage.guild;
        } else {
            isSlash = false;
            author = interactionOrMessage.author;
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            member = interactionOrMessage.mentions.members.first() || interactionOrMessage.guild.members.cache.get(args[1]);
            channel = interactionOrMessage.channel;
            guild = interactionOrMessage.guild;
        }

        // Üye kontrolü
        if (!member) {
            const replyMessage = '`Gidebilmek için bir üye belirtmelisin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true }) 
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        const requesterMember = await guild.members.fetch(author.id);
        const targetMember = await guild.members.fetch(member.id);

        // Ses kanalı kontrolü
        if (!requesterMember.voice.channel || !targetMember.voice.channel || requesterMember.voice.channel.id === targetMember.voice.channel.id) {
            const replyMessage = '`Etiketlenen üye veya sen seste bulunmamaktasın!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 5000));
        }

        // Yönetici yetkisi kontrolü
        if (requesterMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
            try {
                await requesterMember.voice.setChannel(targetMember.voice.channel.id);
                const replyMessage = '`Başarılı bir şekilde etiketlenen üyenin yanına gidildi.`';
                await isSlash
                    ? interactionOrMessage.reply({ content: replyMessage, ephemeral: false })
                    : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 7000));
            } catch (error) {
                console.error('Yönetici olarak taşıma hatası:', error);
                const replyMessage = '`Bir hata oluştu, kullanıcı taşınamadı.`';
                await isSlash
                    ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                    : interactionOrMessage.reply(replyMessage);
            }
        } else {
            // Onay mekanizması
            const embed = new EmbedBuilder()
                .setDescription(`${targetMember}, ${author} seni yanına çekmek istiyor. Gitmek istiyor musun?`)
                .setFooter({ text: 'Onaylamak için 15 saniyen var.' })
                .setColor('Blue');
            
            const confirmationMessage = await channel.send({ content: `${targetMember}`, embeds: [embed] });
            await confirmationMessage.react('✅');

            const filter = (reaction, user) => {
                return reaction.emoji.name === '✅' && user.id === targetMember.id;
            };

            confirmationMessage.awaitReactions({ filter, max: 1, time: 15_000, errors: ['time'] })
                .then(collected => {
                    const reaction = collected.first();
                    if (reaction) {
                        requesterMember.voice.setChannel(targetMember.voice.channel.id)
                            .then(() => {
                                const replyMessage = '`Başarılı bir şekilde etiketlenen üyenin yanına gidildi.`';
                                if (isSlash) {
                                    interactionOrMessage.reply({ content: replyMessage });
                                } else {
                                    confirmationMessage.delete().then(() => channel.send(replyMessage));
                                }
                            })
                            .catch(error => {
                                console.error('Taşıma işlemi sırasında hata:', error);
                                const replyMessage = '`Kullanıcı taşınırken bir hata oluştu.`';
                                if (isSlash) {
                                    interactionOrMessage.reply({ content: replyMessage, ephemeral: true });
                                } else {
                                    confirmationMessage.delete().then(() => channel.send(replyMessage));
                                }
                            });
                    }
                })
                .catch(collected => {
                    const replyMessage = '`Onaylanma süresi doldu.`';
                    if (isSlash) {
                        interactionOrMessage.followUp({ content: replyMessage, ephemeral: true });
                    } else {
                        confirmationMessage.delete().then(() => channel.send(replyMessage));
                    }
                });
        }
    },
    
    // Prefix komutu bilgisi
    name: 'git',
    description: 'Belirtilen kullanıcının yanına sesli kanalda gider.',
    aliases: ['goto'],
};
