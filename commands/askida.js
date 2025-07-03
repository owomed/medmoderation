const db = require('quick.db');
const config = require('../Settings/config.json');

const yetkiliRolleri = [
  "1189127683653783552", "1236282803675467776", "1236290869716455495",
  "833410743951949825", "1236297871020658751", "1238576058119487539",
  "1236294590626267197", "1236314485547860069", "1236317902295138304"
];

const askidaRolID = "1267447176422752360";

module.exports = {
  name: 'askıda',
  async execute(client, message, args) {
    if (message.author.id !== config.sahip) return message.reply("`Bu komutu sadece bot sahibi kullanabilir.`");

    const member = message.mentions.members.first();
    if (!member) return message.reply("`Lütfen geçerli bir kullanıcı etiketleyin.`");

    const key = `askida_${member.id}`;
    const oncekiRoller = db.get(key);

    // Zaten askıya alınmışsa => geri iade et
    if (oncekiRoller) {
      await member.roles.add(oncekiRoller).catch(() => {});
      await member.roles.remove(askidaRolID).catch(() => {});
      db.delete(key);

      return message.channel.send(`${member} \`kullanıcısının rolleri geri verildi ve askıdan çıkarıldı.\``);
    }

    // Yeni askıya alınıyorsa
    const alinacakRoller = member.roles.cache
      .filter(r => yetkiliRolleri.includes(r.id))
      .map(r => r.id);

    if (alinacakRoller.length === 0) {
      return message.reply("Bu kullanıcıda alınacak olan **`(kayıt edilecek)`** yetkili rolleri bulunamadı.");
    }

    db.set(key, alinacakRoller);
    await member.roles.remove(alinacakRoller).catch(() => {});
    await member.roles.add(askidaRolID).catch(() => {});

    return message.channel.send(`${member} kullanıcısı askıya alındı. *\`Rolleri kaydedildi ve askıya özel rol verildi.\`*`);
  }
};
