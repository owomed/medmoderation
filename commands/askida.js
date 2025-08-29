const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

const yetkiliRolleri = [
    "1189127683653783552", "1236282803675467776", "1236290869716455495",
    "833410743951949825", "1236297871020658751", "1238576058119487539",
    "1236294590626267197", "1236314485547860069", "1236317902295138304",
    "1236394142788091995", "1238598132745506856", "1238598537948954824",
    "1234829842889838643", "1236391984415903815", "1236395447711694940",
    "1236396201180659803"
];

const askidaRolID = "1267447176422752360";

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('askıda')
        .setDescription('Belirtilen kullanıcıyı askıya alır veya askıdan çıkarır.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Askıya alınacak veya askıdan çıkarılacak kullanıcı.')
                .setRequired(true)),

    // Prefix komutu bilgisi
    name: 'askıda',
    aliases: ['askida'],

    // Hem slash hem de prefix için çalışacak ana fonksiyon
    async execute(interactionOrMessage) {
        let member, author, channel, isSlash;

        isSlash = interactionOrMessage.isCommand?.();
        if (isSlash) {
            member = interactionOrMessage.options.getMember('kullanıcı');
            author = interactionOrMessage.user;
            channel = interactionOrMessage.channel;
        } else {
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            member = interactionOrMessage.mentions.members.first() || interactionOrMessage.guild.members.cache.get(args[1]);
            author = interactionOrMessage.author;
            channel = interactionOrMessage.channel;
        }

        const yetkiliAlimRolID = id.YetkiliAlim?.yetkilialim;

        const botSahipID = ayar.sahip;

        const isAuthorized = author.id === botSahipID || interactionOrMessage.member.roles.cache.has(yetkiliAlimRolID);

        if (!isAuthorized) {
            const replyMessage = '`Bu komutu sadece bot sahibi veya yetkili alım rolüne sahip kişiler kullanabilir.`';
            return isSlash ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true }) : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        if (!member) {
            const replyMessage = '`Lütfen geçerli bir kullanıcı etiketleyin.`';
            return isSlash ? interactionOrMessage.reply({ content: replyMessage, ephemeral: true }) : interactionOrMessage.reply(replyMessage).then(x => setTimeout(() => x.delete(), 3000));
        }

        const memberId = member.id;

        // Sequelize ile veritabanından veriyi çek
        const askidaRecord = await interactionOrMessage.client.Askida.findByPk(memberId);

        // --- Zaten askıya alınmışsa => geri iade et ---
        if (askidaRecord) {
            const oncekiRoller = askidaRecord.roles;

            if (!member.roles.cache.has(askidaRolID)) {
                await askidaRecord.destroy(); // Kaydı sil
                return channel.send(`${member} kullanıcısı zaten askıda değil. Veri tabanından kaydı silindi.`);
            }

            try {
                await member.roles.add(oncekiRoller).catch(() => {});
                await member.roles.remove(askidaRolID).catch(() => {});

                await askidaRecord.destroy(); // Kaydı sil

                const replyContent = `${member} \`kullanıcısının rolleri geri verildi ve askıdan çıkarıldı.\``;
                return isSlash ? await interactionOrMessage.reply({ content: replyContent, ephemeral: false }) : await channel.send(replyContent);
            } catch (error) {
                console.error('Rolleri geri verirken bir hata oluştu:', error);
                const replyContent = 'Rolleri geri verirken bir hata oluştu.';
                return isSlash ? await interactionOrMessage.reply({ content: replyContent, ephemeral: true }) : await channel.send(replyContent);
            }
        }

        // --- Yeni askıya alınıyorsa ---
        const alinacakRoller = member.roles.cache
            .filter(r => yetkiliRolleri.includes(r.id))
            .map(r => r.id);

        if (alinacakRoller.length === 0) {
            const replyContent = "Bu kullanıcıda alınacak olan **`(kayıt edilecek)`** yetkili rolleri bulunamadı.";
            return isSlash ? await interactionOrMessage.reply({ content: replyContent, ephemeral: true }) : await channel.send(replyContent);
        }

        try {
            // Veriyi veritabanına kaydet
            await interactionOrMessage.client.Askida.create({
                memberId: memberId,
                roles: alinacakRoller
            });

            await member.roles.remove(alinacakRoller).catch(() => {});
            await member.roles.add(askidaRolID).catch(() => {});

            const replyContent = `${member} kullanıcısı askıya alındı. *\`Rolleri kaydedildi ve askıya özel rol verildi.\`*`;
            return isSlash ? await interactionOrMessage.reply({ content: replyContent, ephemeral: false }) : await channel.send(replyContent);
        } catch (error) {
            console.error('Kullanıcıyı askıya alırken bir hata oluştu:', error);
            const replyContent = 'Kullanıcıyı askıya alırken bir hata oluştu.';
            return isSlash ? await interactionOrMessage.reply({ content: replyContent, ephemeral: true }) : await channel.send(replyContent);
        }
    },
};
