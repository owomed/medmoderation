const { Client, Collection, GatewayIntentBits, Partials, ActivityType } = require('discord.js');
const fs = require('fs');
const db = require("quick.db");
const { prefix } = require('./Settings/config.json');
require('dotenv').config();
require('./stayInVoice.js');
const express = require('express');

// Bot istemcisini modern intentlerle başlatın
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Komutları ve slash komutlarını saklamak için koleksiyonlar
client.commands = new Collection();
const slashCommands = [];

// Komut dosyalarını yükle
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);

    // Eğer komutun slash komut verisi varsa, bunu kaydet
    if (command.data) {
        slashCommands.push(command.data.toJSON());
    }
}

// Bot hazır olduğunda çalışacak kod
client.once('clientReady', async () => { // "ready" olayı "clientReady" olarak güncellendi
    console.log(`Bot ${client.user.tag} olarak aktif!`);

    // Slash komutlarını kaydet
    const { REST } = require('@discordjs/rest');
    const { Routes } = require('discord-api-types/v9');

    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: slashCommands },
        );
        console.log('Başarıyla global slash komutları kaydedildi.');
    } catch (error) {
        console.error('Slash komutları kaydedilirken hata oluştu:', error);
    }

    // İstediğiniz özel durumu ayarla
    setStatus();
});

// Kalpleri değiştiren özel durum rotasyonu
function setStatus() {
    const statuses = [
        { name: 'OwO ❤ MED ile ilgileniyor', type: ActivityType.Custom, state: 'OwO ❤ MED ile ilgileniyor' },
        { name: 'OwO 💗 MED ile ilgileniyor', type: ActivityType.Custom, state: 'OwO 💗 MED ile ilgileniyor' },
        { name: 'OwO 💖 MED ile ilgileniyor', type: ActivityType.Custom, state: 'OwO 💖 MED ile ilgileniyor' }
    ];
    let statusIndex = 0;

    // Durumu 5 saniyede bir güncelleyin
    setInterval(() => {
        client.user.setActivity(statuses[statusIndex]);
        statusIndex = (statusIndex + 1) % statuses.length;
    }, 5000); 
}

// Prefix komutlarını dinle
client.on('messageCreate', async message => {
    try {
        if (!message.content.startsWith(prefix) || message.author.bot || message.channel.type === 'dm') return;

        const args = message.content.slice(prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(x => x.aliases && x.aliases.includes(commandName));

        if (!command) return;

        await command.execute(message, args);
    } catch (error) {
        console.error('Komut çalıştırma hatası:', error);
        message.reply('Komut çalıştırılırken bir hata oluştu.');
    }
});

// Slash komutlarını ve buton etkileşimlerini dinle
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Etkileşim komutu çalıştırılırken hata oluştu:', error);
        await interaction.reply({ content: 'Bu komut çalıştırılırken bir hata oluştu!', ephemeral: true });
    }
});

// Özel tarih formatlama işlevi
Date.prototype.toTurkishFormatDate = function (format) {
    let date = this,
    day = date.getDate(),
    weekDay = date.getDay(),
    month = date.getMonth(),
    year = date.getFullYear(),
    hours = date.getHours(),
    minutes = date.getMinutes(),
    seconds = date.getSeconds();

    let monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    let dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

    if (!format) {
        format = "dd MM yyyy | hh:ii:ss";
    }
    format = format.replace("mm", month.toString().padStart(2, "0"));
    format = format.replace("MM", monthNames[month]);

    if (format.indexOf("yyyy") > -1) {
        format = format.replace("yyyy", year.toString());
    } else if (format.indexOf("yy") > -1) {
        format = format.replace("yy", year.toString().substr(2, 2));
    }

    format = format.replace("dd", day.toString().padStart(2, "0"));
    format = format.replace("DD", dayNames[weekDay]);

    if (format.indexOf("HH") > -1) format = format.replace("HH", hours.toString().replace(/^(\d)$/, '0$1'));
    if (format.indexOf("hh") > -1) {
        if (hours > 12) hours -= 12;
        if (hours === 0) hours = 12;
        format = format.replace("hh", hours.toString().replace(/^(\d)$/, '0$1'));
    }
    if (format.indexOf("ii") > -1) format = format.replace("ii", minutes.toString().replace(/^(\d)$/, '0$1'));
    if (format.indexOf("ss") > -1) format = format.replace("ss", seconds.toString().replace(/^(\d)$/, '0$1'));
    return format;
};

// Özel tarih hesaplama işlevi
client.tarihHesapla = (date) => {
    const startedAt = Date.parse(date);
    var msecs = Math.abs(new Date() - startedAt);

    const years = Math.floor(msecs / (1000 * 60 * 60 * 24 * 365));
    msecs -= years * 1000 * 60 * 60 * 24 * 365;
    const months = Math.floor(msecs / (1000 * 60 * 60 * 24 * 30));
    msecs -= months * 1000 * 60 * 60 * 24 * 30;
    const weeks = Math.floor(msecs / (1000 * 60 * 60 * 24 * 7));
    msecs -= weeks * 1000 * 60 * 60 * 24 * 7;
    const days = Math.floor(msecs / (1000 * 60 * 60 * 24));
    msecs -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(msecs / (1000 * 60 * 60));
    msecs -= hours * 1000 * 60 * 60;
    const mins = Math.floor((msecs / (1000 * 60)));
    msecs -= mins * 1000 * 60;
    const secs = Math.floor(msecs / 1000);
    msecs -= secs * 1000;

    var string = "";
    if (years > 0) string += `${years} yıl ${months} ay`;
    else if (months > 0) string += `${months} ay ${weeks > 0 ? weeks + " hafta" : ""}`;
    else if (weeks > 0) string += `${weeks} hafta ${days > 0 ? days + " gün" : ""}`;
    else if (days > 0) string += `${days} gün ${hours > 0 ? hours + " saat" : ""}`;
    else if (hours > 0) string += `${hours} saat ${mins > 0 ? mins + " dakika" : ""}`;
    else if (mins > 0) string += `${mins} dakika ${secs > 0 ? secs + " saniye" : ""}`;
    else if (secs > 0) string += `${secs} saniye`;
    else string += `saniyeler`;

    string = string.trim();
    return `\`${string} önce\``;
};

// Express.js sunucusu oluştur
const app = express();
const port = 3000;

app.get('/', (req, res) => res.status(200).send('Çalışma Süresi Botuna Göre Güç'));

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda çalışıyor`);
});

const { Sequelize } = require('sequelize');

// Render'da ayarladığınız ortam değişkenini kullanır
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});

// Modeli tanımlayın
const Askida = sequelize.define('Askida', {
  memberId: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
  },
  roles: {
    type: Sequelize.JSON,
    allowNull: false,
  },
}, {
    timestamps: false,
    tableName: 'askida'
});

// Veritabanına bağlanın ve tabloyu senkronize edin
sequelize.authenticate()
    .then(() => console.log('Veritabanına başarıyla bağlandı.'))
    .catch(err => console.error('Veritabanına bağlanırken hata oluştu:', err));

sequelize.sync();


client.login(process.env.DISCORD_TOKEN);
