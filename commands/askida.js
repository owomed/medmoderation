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
    data: new SlashCommandBuilder()
        .setName('askıda')
        .setDescription('Belirtilen kullanıcıyı askıya alır veya askıdan çıkarır.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Askıya alınacak veya askıdan çıkarılacak kullanıcı.')
                .setRequired(true)),
    name: 'askıda',
    aliases: ['askida'],

    async execute(interactionOrMessage) {
        let member, author, channel, isSlash;
        const client = interactionOrMessage.client;
        let replied = false;

        try {
            if (interactionOrMessage.isCommand?.()) {
                await interactionOrMessage.deferReply({ ephemeral: true });
                replied = true;
            }

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
                return replied ? interactionOrMessage.editReply({ content: replyMessage, ephemeral: true }) : interactionOrMessage.reply({ content: replyMessage, ephemeral: true });
            }

            if (!member) {
                const replyMessage = '`Lütfen geçerli bir kullanıcı etiketleyin.`';
                return replied ? interactionOrMessage.editReply({ content: replyMessage, ephemeral: true }) : interactionOrMessage.reply({ content: replyMessage, ephemeral: true });
            }

            const memberId = member.id;
            const askidaRecord = client.Askida.findOne({ memberId: memberId });

            // Kullanıcı zaten askıdaysa
            if (askidaRecord) {
                if (!member.roles.cache.has(askidaRolID)) {
                    await askidaRecord.destroy();
                    const replyContent = `${member} kullanıcısı zaten askıda değil. Veri tabanındaki fazladan kayıt temizlendi.`;
                    return replied ? interactionOrMessage.editReply({ content: replyContent, ephemeral: true }) : channel.send(replyContent);
                }

                await member.roles.add(askidaRecord.roles).catch(() => {});
                await member.roles.remove(askidaRolID).catch(() => {});
                await askidaRecord.destroy();

                const replyContent = `${member} \`kullanıcısının rolleri geri verildi ve askıdan çıkarıldı.\``;
                return replied ? interactionOrMessage.editReply({ content: replyContent, ephemeral: false }) : channel.send(replyContent);
            }

            // Kullanıcı askıda değilse
            const alinacakRoller = member.roles.cache
                .filter(r => yetkiliRolleri.includes(r.id))
                .map(r => r.id);

            if (alinacakRoller.length === 0) {
                const replyContent = "Bu kullanıcıda askıya alınacak yetkili rolleri bulunamadı.";
                return replied ? interactionOrMessage.editReply({ content: replyContent, ephemeral: true }) : channel.send(replyContent);
            }

            await client.Askida.create({
                memberId: memberId,
                roles: alinacakRoller
            });

            await member.roles.remove(alinacakRoller).catch(() => {});
            await member.roles.add(askidaRolID).catch(() => {});

            const replyContent = `${member} kullanıcısı askıya alındı. *\`Rolleri kaydedildi ve askıya özel rol verildi.\`*`;
            return replied ? interactionOrMessage.editReply({ content: replyContent, ephemeral: false }) : channel.send(replyContent);

        } catch (error) {
            console.error('Komut çalıştırılırken bir hata oluştu:', error);
            const replyContent = 'Komut çalıştırılırken beklenmedik bir hata oluştu. Bot geliştiricisine danışın.';
            return replied ? interactionOrMessage.editReply({ content: replyContent, ephemeral: true }) : interactionOrMessage.reply({ content: replyContent, ephemeral: true });
        }
    },
};
