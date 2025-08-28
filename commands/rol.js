const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('rol')
        .setDescription('Belirtilen üyeye rol verir veya alır.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ver')
                .setDescription('Belirtilen üyeye rol verir.')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Rol verilecek kullanıcı.')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Verilecek rol.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('al')
                .setDescription('Belirtilen üyeden rol alır.')
                .addUserOption(option =>
                    option.setName('kullanıcı')
                        .setDescription('Rolü alınacak kullanıcı.')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Alınacak rol.')
                        .setRequired(true))),
    
    // Prefix komut bilgisi
    name: 'rol',
    aliases: ['r'],
    
    async execute(interactionOrMessage, args) {
        let isSlash = interactionOrMessage.isCommand?.();
        let user, role, action, author, guild;

        if (isSlash) {
            action = interactionOrMessage.options.getSubcommand();
            user = interactionOrMessage.options.getMember('kullanıcı');
            role = interactionOrMessage.options.getRole('rol');
            author = interactionOrMessage.user;
            guild = interactionOrMessage.guild;
        } else {
            action = args[0];
            user = interactionOrMessage.mentions.members.first() || interactionOrMessage.guild.members.cache.get(args[1]);
            role = interactionOrMessage.mentions.roles.first() || interactionOrMessage.guild.roles.cache.get(args[2]);
            author = interactionOrMessage.author;
            guild = interactionOrMessage.guild;
        }

        const yetkiliRolleri = id.Roles.roleyetkiliid; // Ayarlar dosyasındaki rol ID'sini buraya ekle
        const requesterMember = await guild.members.fetch(author.id);

        // Yetki Kontrolü (Sadece Rol ve Sahip)
        if (!requesterMember.roles.cache.some(r => yetkiliRolleri.includes(r.id)) && author.id !== ayar.sahip) {
            const replyMessage = '`Bu komudu kullanmak için gerekli yetkili role sahip değilsin!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Argüman ve pozisyon kontrolü
        if (!user || !role || (action !== 'ver' && action !== 'al')) {
            const replyMessage = '`Lütfen geçerli bir işlem (ver/al), üye ve rol belirtin!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        if (requesterMember.roles.highest.position <= user.roles.highest.position) {
            const replyMessage = '`Etiketlediğin üye senden üst veya senle aynı pozisyonda!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        // Botun pozisyon kontrolü
        const botMember = guild.members.me;
        if (botMember.roles.highest.position <= role.position) {
            const replyMessage = '`Botun bu role işlem yapabilmesi için senden üstte olması gerekir!`';
            return isSlash
                ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        try {
            if (action === "ver") {
                if (user.roles.cache.has(role.id)) {
                    const replyMessage = '`Etiketlenen üyede bu rol zaten bulunuyor!`';
                    return isSlash
                        ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                        : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
                }
                await user.roles.add(role.id);
                const successMessage = `\`${user.user.tag}\` kişisine başarıyla \`${role.name}\` rolünü verdim.`;
                return isSlash
                    ? interactionOrMessage.reply({ content: successMessage })
                    : interactionOrMessage.reply(successMessage);
            }
            
            if (action === "al") {
                if (!user.roles.cache.has(role.id)) {
                    const replyMessage = '`Etiketlenen üyede bu rol bulunmamaktadır!`';
                    return isSlash
                        ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true })
                        : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
                }
                await user.roles.remove(role.id);
                const successMessage = `\`${user.user.tag}\` kişisinden başarıyla \`${role.name}\` rolünü aldım.`;
                return isSlash
                    ? interactionOrMessage.reply({ content: successMessage })
                    : interactionOrMessage.reply(successMessage);
            }
        } catch (error) {
            console.error('Rol işlemi sırasında bir hata oluştu:', error);
            const errorMessage = '`Rol işlemi sırasında bir hata oluştu.`';
            return isSlash
                ? interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
