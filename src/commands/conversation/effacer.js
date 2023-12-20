const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const logger = require('../../config/logger');
const { embed } = require('../../config/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('effacer')
    .setDescription('Supprimer une sélection de messages dans un salon.')
    .addIntegerOption((option) =>
      option.setName('nombre').setDescription('Nombre de messages à supprimer.').setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply("Tu n'as pas la permission de supprimer des messages !");
    }
    const messages = interaction.options.getInteger('nombre');
    if (!messages) return interaction.reply('Pas de nombre de messages à supprimer.');
    if (messages < 1 || messages > 200)
      return interaction.reply('Le nombre de messages à supprimer doit être compris entre 1 et 200.');
    await interaction.channel.bulkDelete(messages);
    await interaction.reply({
      embeds: [
        embed(interaction, [], `${interaction.member.user.globalName} a supprimé ${messages} messages dans ce salon.`),
      ],
    });
    logger.info(`${interaction.member.user.globalName} a supprimé ${messages} messages dans ${interaction.channel.name}`);
  },
};
