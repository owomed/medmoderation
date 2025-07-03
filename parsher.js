const Discord = require('discord.js');
const { Client, Collection } = require('discord.js');
const fs = require('fs');
const db = require("quick.db");
const { prefix } = require('./Settings/config.json');
require('dotenv').config();
require('./stayInVoice.js');
const express = require('express');

const client = new Client();
client.commands = new Collection();

// Komut dosyalarını yükle
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Mesaj olayını dinle
client.on('message', async message => {
  try {
    if (!message.content.startsWith(prefix) || message.author.bot || message.channel.type === 'dm') return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(x => x.aliases && x.aliases.includes(commandName));

    if (!command) return;

    await command.execute(client, message, args);
  } catch (error) {
    console.error('Komut çalıştırma hatası:', error);
    message.reply('Komut çalıştırılırken bir hata oluştu.');
  }
});

// Tarih formatlama işlevi
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

// Tarih hesaplama işlevi
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

// Durumları ayarla
const statuses = [
  { name: 'MED Moderation', type: 'WATCHING' },
  { name: 'MED 💚 hicckimse', type: 'LISTENING' },
  { name: 'hicckimse 💛 MED', type: 'LISTENING' },
  { name: 'MED ❤️ hicckimse', type: 'LISTENING' },
  { name: 'hicckimse 🤍 MED', type: 'LISTENING' },
  { name: 'MED 🤎 hicckimse', type: 'LISTENING' },
  { name: 'hicckimse 💜 MED', type: 'LISTENING' },
  { name: 'MED ❤ hicckimse', type: 'LISTENING' },
  { name: 'hicckimse 💙 MED', type: 'LISTENING' }
];
let statusIndex = 0;

client.on('ready', () => {
  console.log('Bot Aktif');
  setStatus();
});

// Durumları güncelle
function setStatus() {
  client.user.setActivity(statuses[statusIndex].name, { type: statuses[statusIndex].type });
  statusIndex = (statusIndex + 1) % statuses.length;
  setTimeout(setStatus, 20000); // Her 20 saniyede bir durumu güncelle
}

// Express.js sunucusu oluştur
const app = express();
const port = 3000;

app.get('/', (req, res) => res.status(200).send('Çalışma Süresi Botuna Göre Güç'));

app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor`);
});

client.login(process.env.token);
