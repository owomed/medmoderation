const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const ms = require('ms');
const db = require('quick.db');
const id = require('../Settings/idler.json');
const ayar = require('../Settings/config.json');

// Türkçe tarih formatı için bir prototip eklemesi (eğer ana bot dosyasında yoksa)
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
        .setName('tempvmute')
        .setDescription('Bir kullanıcıyı belirtilen süre boyunca ses kanallarında susturur.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Susturulacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('süre')
                .setDescription('Susturma süresi (örn: 1m, 1h, 1d).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Susturma sebebi.')
                .setRequired(true)),

    // Prefix komut bilgisi
    name: 'tempvmute',
    aliases: ['vsürelimute', 'süreli-vmute', 'temp-vmute'],

    async execute(interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;

        let targetMember, duration, reason;
        if (isSlash) {
            targetMember = interactionOrMessage.options.getMember('kullanıcı');
            duration = interactionOrMessage.options.getString('süre');
            reason = interactionOrMessage.options.getString('sebep');
        } else {
            targetMember = interactionOrMessage.mentions.members.first() || guild.members.cache.get(args[0]);
            duration = args[1];
            reason = args.slice(2).join(' ');
        }

        // Yetki kontrolü (hem rol hem de sunucu izni)
        const muteYetkilisiRole = id.Mute.muteyetkiliid;
        if (!interactionOrMessage.member.roles.cache.has(muteYetkilisiRole) && !interactionOrMessage.member.permissions.has(PermissionsBitField.Flags.MuteMembers) && author.id !== ayar.sahip) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Yetkisiz Kullanım')
                .setDescription('`Bu komudu kullanmak için gerekli izinlere sahip değilsin!`');
            return isSlash 
                ? interactionOrMessage.reply({ embeds: [embed], ephemeral: true })
                : interactionOrMessage.reply({ embeds: [embed] }).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        // Argüman ve kullanıcı kontrolleri
        if (!targetMember || !duration || !reason) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Eksik Bilgi')
                .setDescription('`Ses kanallarında susturmak için üye, süre(1s,1m,1h,1d) ve sebep belirtmelisin!`');
            return isSlash 
                ? interactionOrMessage.reply({ embeds: [embed], ephemeral: true })
                : interactionOrMessage.reply({ embeds: [embed] }).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        if (interactionOrMessage.member.roles.highest.position <= targetMember.roles.highest.position) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('İşlem Başarısız')
                .setDescription('`Etiketlediğin kullanıcı senden üst veya senle aynı pozisyonda!`');
            return isSlash 
                ? interactionOrMessage.reply({ embeds: [embed], ephemeral: true })
                : interactionOrMessage.reply({ embeds: [embed] }).then(x => setTimeout(() => x.delete(), 3000));
        }
        
        if (!targetMember.voice.channel) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('İşlem Başarısız')
                .setDescription('`Etiketlenen kullanıcı bir ses kanalında değil!`');
            return isSlash 
                ? interactionOrMessage.reply({ embeds: [embed], ephemeral: true })
                : interactionOrMessage.reply({ embeds: [embed] }).then(x => setTimeout(() => x.delete(), 3000));
        }

        try {
            await targetMember.voice.setMute(true, reason);
            await db.push(`üye.${targetMember.id}.ssicil`, {
                Yetkili: author.id,
                Tip: "VOICE MUTE",
                Sebep: reason,
                Zaman: Date.now(),
                Süre: duration
            });
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Ses Susturma Başarılı')
                .setDescription(`${targetMember} adlı üye başarıyla ses kanallarında susturuldu.`)
                .addFields(
                    { name: 'Süre', value: `\`${duration}\``, inline: true },
                    { name: 'Sebep', value: `\`${reason}\``, inline: true }
                )
                .setTimestamp();

            isSlash 
                ? await interactionOrMessage.reply({ embeds: [successEmbed] })
                : await interactionOrMessage.reply({ embeds: [successEmbed] });

            await interactionOrMessage.react('🔇');
            
            const muteLogChannel = guild.channels.cache.get(id.Mute.mutelogkanalid);
            if (muteLogChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#97ffff')
                    .setTitle('Geçici Ses Susturma')
                    .setDescription(`
                        **Kullanıcı:** ${targetMember} (\`${targetMember.id}\`)
                        **Yetkili:** ${author} (\`${author.id}\`)
                        **Sebep:** \`${reason}\`
                        **Süre:** \`${duration}\`
                    `)
                    .setTimestamp();
                muteLogChannel.send({ embeds: [logEmbed] });
            }

            setTimeout(async () => {
                const member = guild.members.cache.get(targetMember.id);
                if (member && member.voice.channel && member.voice.mute) {
                    await member.voice.setMute(false, 'Süre dolduğu için susturulması kaldırıldı.');
                    if (muteLogChannel) {
                        const unMuteEmbed = new EmbedBuilder()
                            .setColor('#55FF55')
                            .setTitle('Ses Susturma Sona Erdi')
                            .setDescription(`${member} kullanıcısının ses susturması sona erdi.`)
                            .setTimestamp();
                        muteLogChannel.send({ embeds: [unMuteEmbed] });
                    }
                }
            }, ms(duration));
        
        } catch (error) {
            console.error('tempvmute komutu hatası:', error);
            const errorMessage = '`Kullanıcı ses kanalında susturulurken bir hata oluştu.`';
            isSlash
                ? await interactionOrMessage.reply({ content: errorMessage, ephemeral: true })
                : await interactionOrMessage.reply(errorMessage).then(x => setTimeout(() => x.delete(), 3000));
        }
    }
};
