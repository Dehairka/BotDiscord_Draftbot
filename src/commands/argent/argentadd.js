const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const User = require('../../models/user.model');
const logger = require('../../config/logger');
const { embed } = require('../../config/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('argentadd')
    .setDescription('Ajouter des diamants à un membre')
    .addUserOption((option) => option.setName('membre').setDescription('Membre qui recevra les diamants').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('montant').setDescription('Montant de diamants à ajouter').setRequired(true)
    )
    .addStringOption((option) => option.setName('raison').setDescription('Raison du don').setRequired(false)),

  async execute(interaction) {
    // Search if the user has the permission to use this command
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply("Tu n'as pas la permission d'ajouter des diamants !");
    }
    // Get the user to add diamonds to
    const user = interaction.options.getUser('membre');
    if (!user) return interaction.reply('Pas de membre à qui donner des diamants');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply('Pas de membre à qui donner des diamants');
    // Look for the user in the database
    let userDB = await User.findOne({ discordId: user.id }).exec();
    if (!userDB) {
      // If the user is not in the database, create it
      const newUser = new User({
        discordId: user.id,
        diamonds: 0,
        name: user.username,
      });
      userDB = await newUser.save();
    }
    // Get the reason for the donation
    const reason = interaction.options.getString('raison');
    // Get the amount of diamonds to add
    const amount = interaction.options.getInteger('montant');
    // Add the diamonds to the user
    userDB.diamonds += amount;
    await userDB.save();
    // Send a message to the user
    const fields = [
      { name: 'Membre qui à reçu les diamants', value: user.username },
      { name: 'Montant du don', value: `${amount} 💎`, inline: true },
    ];
    if (reason) {
      fields.push({ name: 'Raison du don', value: reason, inline: true });
    }

    await interaction.reply({ embeds: [embed(interaction, fields, 'Vous avez bien ajouté des diamants à un membre')] });
    logger.info(
      `${interaction.member.user.globalName} a ajouté ${amount} diamants à ${user.username} | Raison : ${reason} | Il en a maintenant ${userDB.diamonds}`
    );
    // await interaction.reply(
    //   `Tu as ajouté ${amount} diamants à ${user.username} | Raison : ${reason} | Il en a maintenant ${userDB.diamonds}`
    // );
  },
};
