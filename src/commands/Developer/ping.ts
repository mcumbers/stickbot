import { BotCommand } from '#lib/extensions/BotCommand';
import { Prisma } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { type ChatInputCommand } from '@sapphire/framework';

@ApplyOptions<ChatInputCommand.Options>({
	description: 'Check Bot\'s Ping',
	preconditions: ['DevOnly']
})

export class UserCommand extends BotCommand {
	public override registerApplicationCommands(registry: ChatInputCommand.Registry) {
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

	public async chatInputRun(interaction: ChatInputCommand.Interaction) {
		const ephemeral = interaction.options.getBoolean('private') ?? false;
		const msg = await interaction.deferReply({ ephemeral, fetchReply: true });

		if (isMessageInstance(msg)) {
			const ping = msg.createdTimestamp - interaction.createdTimestamp;
			const dbPing = await this.getDBPing(Date.now());
			return interaction.editReply(`🏓 Pong! \`Bot: ${ping}ms\` \`Database: ${dbPing}ms\``);
		}

		return interaction.editReply(`Failed to retrieve ping.`);
	}

	private async getDBPing(startTime = Date.now()) {
		const result = await this.container.prisma._prisma.$queryRaw(Prisma.sql`SELECT 1`);
		return result ? Date.now() - startTime : null;
	}
}
