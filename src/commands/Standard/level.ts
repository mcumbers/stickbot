import { getLevel } from '#utils/functions/xp';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

@ApplyOptions<Command.Options>({
	description: 'Check Your XP Level',
	preconditions: ['GuildOnly'],
	cooldownDelay: 15000
})

export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addBooleanOption((option) =>
					option
						.setName('private')
						.setDescription('Whether or not the message should be shown only to you (default false)')
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const ephemeral = interaction.options.getBoolean('private') ?? false;
		await interaction.deferReply({ fetchReply: true, ephemeral });
		const { prisma } = this.container;

		// See if guild has XP disabled
		if (!interaction.guild) return;
		const guildSettingsXP = await prisma.guildSettingsXP.fetch(interaction.guild.id);
		if (!guildSettingsXP || !guildSettingsXP.enabled) return;

		// Create a memberDataXP record for the member if one doesn't exist
		let memberDataXP = await prisma.memberDataXP.fetchTuple([interaction.user.id, interaction.guild.id], ['userID', 'guildID']);
		if (!memberDataXP) memberDataXP = await prisma.memberDataXP.create({ data: { userID: interaction.user.id, guildID: interaction.guild.id } });

		// Calculate the level info
		const xpLevel = getLevel(memberDataXP!.currentXP);
		// Send message
		return interaction.followUp({ content: `Level ${xpLevel.level} | ${xpLevel.levelXP}/${xpLevel.levelThreshhold}xp` });
	}
}
