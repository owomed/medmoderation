const config = require('../Settings/config.json');
const idler = require('../Settings/idler.json');

module.exports = {
  name: 'yetkileri-al',
  aliases: ['yetkilerial', 'aletykileri'],
  description: 'Etiketlenen kişiden yetkili rolleri alır (sadece bot sahibi).',
  async execute(client, message, args) {
    if (message.author.id !== config.sahip) {
      return message.reply('Bu komutu sadece bot sahibi kullanabilir.');
    }

    const member = message.mentions.members.first();
    if (!member) return message.reply('Lütfen yetkilerini almak istediğiniz kişiyi etiketleyin.');

    const yetkiliRolleri = idler.yetkililerinhepsi;
    const alinanRoller = yetkiliRolleri.filter(rolID => member.roles.cache.has(rolID));

    if (alinanRoller.length === 0) {
      return message.reply('Bu kişide alınacak yetkili rol bulunamadı.');
    }

    try {
      await member.roles.remove(alinanRoller);
      message.channel.send(`${member} **kullanıcısından __yetkili rolleri__ başarıyla alındı.**`);
    } catch (error) {
      console.error('Hata:', error);
      message.channel.send('Rolleri alırken bir hata oluştu.');
    }
  }
};
