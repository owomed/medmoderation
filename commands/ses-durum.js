const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('nerede')
        .setDescription('Etiketlenen üyenin ses kanalındaki durumunu gösterir.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Ses durumuna bakılacak kullanıcı.')
                .setRequired(true)),

    // Prefix komut bilgisi
    name: 'nerede',
    aliases: ['ses-bilgi', 'sesbilgi', 'ses-durum', 'sesdurum'],

    async execute(interactionOrMessage) {
        let member, author, guild, isSlash;

        if (interactionOrMessage.isCommand?.()) {
            isSlash = true;
            author = interactionOrMessage.user;
            guild = interactionOrMessage.guild;
            member = interactionOrMessage.options.getMember('kullanıcı');
        } else {
            isSlash = false;
            author = interactionOrMessage.author;
            guild = interactionOrMessage.guild;
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            member = interactionOrMessage.mentions.members.first() || interactionOrMessage.guild.members.cache.get(args[1]);
        }
        
        const yetkiliRolleri = id.Roles.roleyetkiliid; // Ayarlar dosyasındaki rol ID'sini buraya ekle
        const requesterMember = await guild.members.fetch(author.id);

        // Yetki kontrolü (Sadece Rol ve Sahip)
        if (!requesterMember.roles.cache.some(r => yetkiliRolleri.includes(r.id)) && author.id !== ayar.sahip) {
            const replyMessage = '`Bu komudu kullanmak için gerekli yetkili role sahip değilsin!`';
            return isSlash 
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Üye kontrolü
        if (!member) {
            const replyMessage = '`Ses durumuna bakmak istediğiniz üyeyi belirtiniz!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Ses kanalı kontrolü
        if (!member.voice.channel) {
            const replyMessage = '`Üye ses kanalında bulunmamaktadır!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Durumları kontrol et
        const micStatus = member.voice.selfMute ? "Kapalı 🔇" : "Açık 🎤";
        const deafStatus = member.voice.selfDeaf ? "Kapalı 🎧" : "Açık 👂";
        const streamStatus = member.voice.streaming ? "Açık 🔴" : "Kapalı 🟢";

        const replyMessage = `\`Etiketlenen üye ${member.voice.channel.name} adlı ses kanalında. Kullanıcının mikrofon durumu (${micStatus}), kulaklık durumu (${deafStatus}) ve yayın durumu (${streamStatus}) şeklindedir.\``;

        isSlash
            ? await interactionOrMessage.reply({ content: replyMessage })
            : await interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 7000));
    }
};
