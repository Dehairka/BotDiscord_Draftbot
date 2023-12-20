const { EmbedBuilder } = require('discord.js');

const embed = (interaction, fields, description) => {
  return new EmbedBuilder()
    .setColor('#ff6bff')
    .setTitle('Le Domaine du Plaisir')
    .setAuthor({
      name: interaction.member.user.globalName,
      iconURL: interaction.member.user.avatarURL(),
    })
    .setDescription(description)
    .setThumbnail(
      'https://api.chouette.cc/uploads/Domaine_Du_Plaisir_Avatar_8b96baac7c.jpg?updated_at=2023-12-19T12:22:36.801Z'
    )
    .addFields(fields)
    .setTimestamp();
};

module.exports = { embed };
