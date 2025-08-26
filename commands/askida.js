const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const yetkiliRolleri = [
    "1189127683653783552", "1236282803675467776", "1236290869716455495",
    "833410743951949825", "1236297871020658751", "1238576058119487539",
    "1236294590626267197", "1236314485547860069", "1236317902295138304",
    "1236394142788091995", "1238598132745506856", "1238598537948954824",
    "1234829842889838643", "1236391984415903815", "1236395447711694940",
    "1236396201180659803"
];

const askidaRolID = "1267447176422752360";

// Veri dosyasının yolu
const askidaFilePath = path.resolve(__dirname, '..', 'askida.json');

// JSON dosyasından veriyi okuma fonksiyonu
function getAskidaData() {
    if (!fs.existsSync(askidaFilePath)) {
        return {};
    }
    const data = fs.readFileSync(askidaFilePath, 'utf8');
    return JSON.parse(data);
}

// JSON dosyasına veriyi yazma fonksiyonu
function saveAskidaData(data) {
    fs.writeFileSync(askidaFilePath, JSON.stringify(data, null, 2));
}

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('askıda')
        .setDescription('Belirtilen kullanıcıyı askıya alır veya askıdan çıkarır.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Askıya alınacak veya askıdan çıkarılacak kullanıcı.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator), // Sadece yöneticiler kullanabilir

    // Hem slash hem de prefix için çalışacak ana fonksiyon
    async execute(interactionOrMessage) {
        let member, authorId, channel;
        const askidaData = getAskidaData();

        // Prefix ve Slash komut ayrımı
        if (interactionOrMessage.isCommand?.()) {
            // Slash komutu
            member = interactionOrMessage.options.getMember('kullanıcı');
            authorId = interactionOrMessage.user.id;
            channel = interactionOrMessage.channel;

            if (!member) {
                return interactionOrMessage.reply({ content: 'Lütfen geçerli bir kullanıcı etiketleyin.', ephemeral: true });
            }
        } else {
            // Prefix komutu
            const args = interactionOrMessage.content.slice(1).trim().split(/ +/);
            member = interactionOrMessage.mentions.members.first() || interactionOrMessage.guild.members.cache.get(args[1]);
            authorId = interactionOrMessage.author.id;
            channel = interactionOrMessage.channel;
            
            if (!member) {
                return interactionOrMessage.reply('Lütfen geçerli bir kullanıcı etiketleyin.');
            }
        }
        
        // Komutu sadece bot sahibi kullanabilir kontrolü
        // config.sahip yerine ID'yi doğrudan buraya yazabilirsiniz veya index.js'te bu değeri tanımlayın.
        // if (authorId !== "BOT_SAHIBI_ID") {
        //   return channel.send("`Bu komutu sadece bot sahibi kullanabilir.`");
        // }

        const memberId = member.id;
        
        // Zaten askıya alınmışsa => geri iade et
        if (askidaData[memberId]) {
            const oncekiRoller = askidaData[memberId];
            
            // Eğer veriler kaybolmuşsa veya kullanıcı zaten askıda değilse
            if (!oncekiRoller || !member.roles.cache.has(askidaRolID)) {
                delete askidaData[memberId];
                saveAskidaData(askidaData);
                return channel.send(`${member} kullanıcısı zaten askıda değil. Veri tabanından kaydı silindi.`);
            }

            try {
                await member.roles.add(oncekiRoller).catch(() => {});
                await member.roles.remove(askidaRolID).catch(() => {});
                
                delete askidaData[memberId];
                saveAskidaData(askidaData);

                const replyContent = `${member} \`kullanıcısının rolleri geri verildi ve askıdan çıkarıldı.\``;
                if (interactionOrMessage.isCommand?.()) {
                    await interactionOrMessage.reply({ content: replyContent, ephemeral: false });
                } else {
                    await channel.send(replyContent);
                }

            } catch (error) {
                console.error('Rolleri geri verirken bir hata oluştu:', error);
                const replyContent = 'Rolleri geri verirken bir hata oluştu.';
                if (interactionOrMessage.isCommand?.()) {
                    await interactionOrMessage.reply({ content: replyContent, ephemeral: true });
                } else {
                    await channel.send(replyContent);
                }
            }
            return;
        }
        
        // Yeni askıya alınıyorsa
        const alinacakRoller = member.roles.cache
            .filter(r => yetkiliRolleri.includes(r.id))
            .map(r => r.id);

        if (alinacakRoller.length === 0) {
            const replyContent = "Bu kullanıcıda alınacak olan **`(kayıt edilecek)`** yetkili rolleri bulunamadı.";
            if (interactionOrMessage.isCommand?.()) {
                return interactionOrMessage.reply({ content: replyContent, ephemeral: true });
            } else {
                return channel.send(replyContent);
            }
        }

        askidaData[memberId] = alinacakRoller;
        saveAskidaData(askidaData);

        try {
            await member.roles.remove(alinacakRoller).catch(() => {});
            await member.roles.add(askidaRolID).catch(() => {});

            const replyContent = `${member} kullanıcısı askıya alındı. *\`Rolleri kaydedildi ve askıya özel rol verildi.\`*`;
            if (interactionOrMessage.isCommand?.()) {
                await interactionOrMessage.reply({ content: replyContent, ephemeral: false });
            } else {
                await channel.send(replyContent);
            }
        } catch (error) {
            console.error('Kullanıcıyı askıya alırken bir hata oluştu:', error);
            const replyContent = 'Kullanıcıyı askıya alırken bir hata oluştu.';
            if (interactionOrMessage.isCommand?.()) {
                await interactionOrMessage.reply({ content: replyContent, ephemeral: true });
            } else {
                await channel.send(replyContent);
            }
        }
    },

    // Prefix komutu bilgisi
    name: 'askıda',
    description: 'Belirtilen kullanıcıyı askıya alır veya askıdan çıkarır.',
    aliases: ['askida'],
};
