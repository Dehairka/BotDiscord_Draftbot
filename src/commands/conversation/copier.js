/* eslint-disable no-restricted-syntax */
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const logger = require('../../config/logger');
const { embed } = require('../../config/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('copier')
    .setDescription('Copier des messages dans un autre salon.')
    .addChannelOption((option) =>
      option.setName('salon').setDescription('Dans quel salon souhaitez-vous copier ce(s) message(s) ?').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('nombre').setDescription('Combien de messages souhaitez-vous copier ?').setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply("Tu n'as pas la permission de copier des messages !");
    }
    const channel = interaction.options.getChannel('salon');
    if (!channel) return interaction.reply('Pas de salon où copier.');
    const messages = interaction.options.getInteger('nombre');
    if (!messages) return interaction.reply('Pas de nombre de messages à copier.');
    if (messages < 1 || messages > 200)
      return interaction.reply('Le nombre de messages à copier doit être compris entre 1 et 200.');
    const messagesToCopy = await interaction.channel.messages.fetch({ limit: messages });
    const messagesToCopyArray = messagesToCopy.reverse();
    for (const message of messagesToCopyArray) {
      const embeds = [];
      if (message.content) {
        embeds.push(embed(interaction, [], message.content));
      }
      if (message.attachments) {
        for (const attachment of message.attachments.values()) {
          embeds.push(embed(interaction, [], attachment.url));
        }
      }
      // eslint-disable-next-line no-await-in-loop
      await channel.send({ embeds });
    }
    await interaction.reply({
      embeds: [
        embed(interaction, [], `${interaction.member.user.globalName} a copié ${messages} messages dans ${channel.name}.`),
      ],
    });
    logger.info(`${interaction.member.user.globalName} a copié ${messages} messages dans ${channel.name}`);
  },
};
