const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// const db = require("quick.db"); // quick.db kaldırıldı
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

module.exports = {
    // Slash komutu verisi
    data: new SlashCommandBuilder()
        .setName('sicil')
        .setDescription('Bir kullanıcının ceza geçmişini gösterir.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Sicili gösterilecek kullanıcı.')
                .setRequired(false)),

    // Prefix komut bilgisi
    name: 'sicil',
    aliases: ['ceza-bilgi', 'sicil-göster', 'ceza'],
    
    async execute(interactionOrMessage, args) {
        let isSlash = interactionOrMessage.isCommand?.();
        let user, member, guild;
        const client = interactionOrMessage.client;

        if (isSlash) {
            user = interactionOrMessage.options.getUser('kullanıcı') || interactionOrMessage.user;
            guild = interactionOrMessage.guild;
        } else {
            user = interactionOrMessage.mentions.users.first() || interactionOrMessage.guild.members.cache.get(args[0])?.user || interactionOrMessage.author;
            guild = interactionOrMessage.guild;
        }

        try {
            member = await guild.members.fetch(user.id);
        } catch {
            member = null;
        }
        
        // ⭐️ MONGODB VERİ ÇEKME İŞLEMİ
        const sicilData = await client.Sicil.findOne({ memberId: user.id });
        
        const tümSicil = sicilData ? sicilData.sicil : [];

        // ⭐️ MONGODB'den çekilen veriyi quick.db'deki eski mantığa göre ayırma
        // Eğer süreli/süresiz ayrımını veritabanında yapmadıysanız, burada yapmanız gerekir.
        // Genellikle MUTE süreli, BAN/KICK/JAIL süresiz olarak kabul edilir, UYARI ise ayrı tutulur.

        const sicil = tümSicil.filter(ceza => 
            ceza.Tip === 'BAN' || 
            ceza.Tip === 'KICK' || 
            ceza.Tip === 'JAIL'
        ); // Süresiz cezalar (quick.db'deki sicil)

        const ssicil = tümSicil.filter(ceza => 
            ceza.Tip === 'MUTE'
        ); // Süreli cezalar (quick.db'deki ssicil)

        const uyarılar = tümSicil.filter(ceza => 
            ceza.Tip === 'UYARI' 
            // Eğer UYARI komutu da sicil modeline kaydediliyorsa
        ); // Uyarılar (quick.db'deki uyarılar)


        // Helper function to format penalties (Aynı Kaldı)
        const formatPenals = (penals, type) => {
            if (penals.length === 0) {
                return `Bu üye hiç ${type} cezası almamış.`;
            }
            
            // Verileri en yeniden en eskiye sırala (reverse)
            return penals.slice().reverse().map((value, index) => {
                const responsibleUser = guild.members.cache.has(value.Yetkili) 
                    ? `<@${value.Yetkili}>` 
                    : `<@${value.Yetkili}> (Sunucuda Yok)`;
                    
                const durationInfo = value.Süre ? `(\`${value.Süre}\` boyunca)` : '';
                
                // Ceza numarasını ve tipini düzeltiyoruz
                return `\`${index + 1}.\` **[${value.Tip}]** <t:${Math.floor(value.Zaman / 1000)}:R> ${durationInfo} (\`${value.Sebep}\`) nedeniyle ${responsibleUser} tarafından cezalandırıldı.`;
            }).join("\n");
        };

        // Check for character limits and create chunks (Aynı Kaldı)
        const formatAndChunk = (penals, type) => {
            const formatted = formatPenals(penals, type);
            const chunks = [];
            let currentChunk = "";
            
            // Eğer hiç ceza yoksa, direkt geri dön
            if (formatted.startsWith("Bu üye hiç")) {
                chunks.push(formatted);
                return chunks;
            }

            // Normalde dizideki her eleman bir satır olacağı için satır satır bölüyoruz
            formatted.split("\n").forEach(line => {
                if ((currentChunk + line).length > 1024) {
                    chunks.push(currentChunk);
                    currentChunk = "";
                }
                currentChunk += (currentChunk === "" ? "" : "\n") + line;
            });
            chunks.push(currentChunk);
            
            return chunks;
        };

        const süresizChunks = formatAndChunk(sicil, 'süresiz');
        const süreliChunks = formatAndChunk(ssicil, 'süreli');
        const uyarıChunks = formatAndChunk(uyarılar, 'uyarı');
        
        const allChunks = [...süresizChunks, ...süreliChunks, ...uyarıChunks];

        const embed = new EmbedBuilder()
            .setColor('#ffac00')
            .setAuthor({ name: `${member ? member.displayName : user.username} Sicil Bilgileri`, iconURL: user.displayAvatarURL({ dynamic: true, size: 1024 }) })
            .setDescription(`**${member ? member.displayName : user.username}** adlı kullanıcının ceza geçmişi (${tümSicil.length} adet) aşağıda listelenmiştir.`);

        // İlk 3 Chunk'ı Embed Field olarak ekle (Eğer boş değillerse)
        if (süreliChunks[0] && süreliChunks[0].length > 0) {
             embed.addFields({ name: 'Süreli Ceza Bilgileri (Mute)', value: süreliChunks[0] });
        }
        if (süresizChunks[0] && süresizChunks[0].length > 0) {
             embed.addFields({ name: 'Süresiz Ceza Bilgileri (Ban, Kick, Jail)', value: süresizChunks[0] });
        }
        if (uyarıChunks[0] && uyarıChunks[0].length > 0) {
             embed.addFields({ name: 'Uyarı Bilgileri', value: uyarıChunks[0] });
        }

        // Eğer ilk field'lar boşsa default mesajları ekle
        if (embed.data.fields.length === 0) {
            embed.setDescription(`**${member ? member.displayName : user.username}** adlı kullanıcının **hiçbir sicil kaydı bulunmamaktadır.**`);
        } else if (!embed.data.fields.some(f => f.name.includes('Süreli'))) {
             embed.addFields({ name: 'Süreli Ceza Bilgileri (Mute)', value: "Bu üye hiç süreli ceza almamış." });
        } else if (!embed.data.fields.some(f => f.name.includes('Süresiz'))) {
             embed.addFields({ name: 'Süresiz Ceza Bilgileri (Ban, Kick, Jail)', value: "Bu üye hiç süresiz ceza almamış." });
        } else if (!embed.data.fields.some(f => f.name.includes('Uyarı'))) {
             embed.addFields({ name: 'Uyarı Bilgileri', value: "Bu üye hiç uyarı almamış." });
        }


        await (isSlash ? interactionOrMessage.reply({ embeds: [embed] }) : interactionOrMessage.reply({ embeds: [embed] }));

        if (allChunks.length > 3) { // Eğer 3'ten fazla chunk varsa ek mesajlar gönder
            // İlk 3 chunk zaten yukarıda gönderildiği için 3. indexten başlatıyoruz.
            for (let i = 3; i < allChunks.length; i++) {
                const followUpEmbed = new EmbedBuilder().setColor('#ffac00').setDescription(allChunks[i]);
                await interactionOrMessage.channel.send({ embeds: [followUpEmbed] });
            }
        }
    }
};
