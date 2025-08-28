const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require("quick.db");
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

// Türkçe tarih formatı için bir prototip eklemesi
// Botun başlatıldığı dosyaya (örn. index.js) eklenmelidir.
/*
Date.prototype.toTurkishFormatDate = function() {
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    return `${days[this.getDay()]}, ${this.getDate()} ${months[this.getMonth()]} ${this.getFullYear()} ${this.getHours()}:${this.getMinutes()}`;
};
*/

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

        const sicil = db.get(`üye.${user.id}.sicil`) || [];
        const ssicil = db.get(`üye.${user.id}.ssicil`) || [];
        const uyarılar = db.get(`üye.${user.id}.uyarılar`) || [];
        
        // Helper function to format penalties
        const formatPenals = (penals, type) => {
            if (penals.length === 0) {
                return `Bu üye hiç ${type} cezası almamış.`;
            }
            
            return penals.reverse().map((value, index) => {
                const responsibleUser = guild.members.cache.has(value.Yetkili) 
                    ? `<@${value.Yetkili}>` 
                    : value.Yetkili;
                
                const durationInfo = value.Süre ? `(\`${value.Süre}\` boyunca)` : '';
                
                return `\`${index + 1}.\` **[${value.Tip}]** <t:${Math.floor(value.Zaman / 1000)}:R> (\`${value.Sebep}\`) nedeniyle ${responsibleUser} tarafından cezalandırıldı.`;
            }).join("\n");
        };

        // Check for character limits and create chunks
        const formatAndChunk = (penals, type) => {
            const formatted = formatPenals(penals, type);
            const chunks = [];
            let currentChunk = "";
            
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
            .setDescription(`**${member ? member.displayName : user.username}** adlı kullanıcının ceza geçmişi aşağıda listelenmiştir.`);

        embed.addFields({ name: 'Süreli Ceza Bilgileri', value: süreliChunks[0] || "Bu üye hiç süreli ceza almamış." });
        embed.addFields({ name: 'Süresiz Ceza Bilgileri', value: süresizChunks[0] || "Bu üye hiç süresiz ceza almamış." });
        embed.addFields({ name: 'Uyarı Bilgileri', value: uyarıChunks[0] || "Bu üye hiç uyarı almamış." });

        await (isSlash ? interactionOrMessage.reply({ embeds: [embed] }) : interactionOrMessage.reply({ embeds: [embed] }));

        if (allChunks.length > 3) { // Eğer 3'ten fazla chunk varsa ek mesajlar gönder
            for (let i = 3; i < allChunks.length; i++) {
                const followUpEmbed = new EmbedBuilder().setColor('#ffac00').setDescription(allChunks[i]);
                await interactionOrMessage.channel.send({ embeds: [followUpEmbed] });
            }
        }
    }
};
