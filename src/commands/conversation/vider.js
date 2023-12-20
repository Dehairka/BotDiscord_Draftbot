const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const logger = require('../../config/logger');
const { embed } = require('../../config/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vider')
    .setDescription("Supprimer tous les messages d'un salon.")
    .addChannelOption((option) => option.setName('salon').setDescription('Salon à vider').setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply("Tu n'as pas la permission de supprimer des messages !");
    }
    const channel = interaction.options.getChannel('salon');
    if (!channel) return interaction.reply('Pas de salon à vider.');
    await channel.bulkDelete(100);
    await interaction.reply({
      embeds: [embed(interaction, [], `${interaction.member.user.globalName} a vidé ${channel.name}.`)],
    });
    logger.info(`${interaction.member.user.globalName} a vidé ${channel.name}`);
  },
};
