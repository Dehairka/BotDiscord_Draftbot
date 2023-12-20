const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { embed } = require('../../config/embed');
const logger = require('../../config/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un membre du serveur')
    .addUserOption((option) => option.setName('membre').setDescription('Membre à bannir').setRequired(true))
    .addStringOption((option) => option.setName('raison').setDescription('Raison du ban').setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply("Tu n'as pas la permission de bannir des membres !");
    }
    // Get the user to ban
    const user = interaction.options.getUser('membre');
    if (!user) return interaction.reply('Pas de membre à bannir');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply('Pas de membre à bannir');

    // Get the reason for the ban
    let reason = interaction.options.getString('raison');
    if (!reason) reason = 'Pas de raison fournie.';
    // Check if the user is trying to ban themselves
    if (interaction.user.id === user.id) return interaction.reply('Essaie pas de te faire ban !');
    // Check if the user is trying to ban the owner of the server
    if ((await interaction.guild.fetchOwner()).id === user.id)
      return interaction.reply('Ne ban pas le propriétaire du serveur !');
    // Check if the bot can ban the user
    if (member && !member.bannable) return interaction.reply('Je ne peux pas ban ce membre !');
    // Check if the user can ban the member
    if (member && interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
      return interaction.reply('Tu ne peux pas ban cette personne car vous avez le même rôle !');
    }
    // Try to send a DM to the user
    try {
      await user.send(
        `Tu as été ban du serveur \`${interaction.guild.name}\` par \`${interaction.user.tag}\` pour la raison : \`${reason}\``
      );
    } catch (err) { }

    // Send a reply to the interaction

    await interaction.reply({
      embeds: [embed(interaction, [], `${interaction.user} a ban \`${user.tag}\` pour la raison : \`${reason}\``)],
    });
    // await interaction.reply(`${interaction.user} a ban \`${user.tag}\` pour la raison : \`${reason}\``);

    // Ban the user
    await member.ban({ reason });
    logger.info(`${interaction.member.user.globalName} a ban ${user.tag} | Raison : ${reason}`);
  },
};
