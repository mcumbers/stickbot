import { GuildLogEmbed } from '#lib/extensions/GuildLogEmbed';
import { CustomEvents } from '#utils/CustomTypes';
import { getAuditLogEntry } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, type ListenerOptions } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { AuditLogEvent, BaseGuildTextChannel, Guild, StageInstance, type GuildAuditLogsEntry } from 'discord.js';

@ApplyOptions<ListenerOptions>({ event: Events.StageInstanceUpdate })
export class UserEvent extends Listener {
	public async run(oldStage: StageInstance, stage: StageInstance) {
		if (isNullish(stage.id)) return;

		const guildSettingsInfoLogs = await this.container.prisma.guildSettingsInfoLogs.fetch(stage.guild?.id as string);
		if (!guildSettingsInfoLogs?.stageInstanceUpdateLog || !guildSettingsInfoLogs.infoLogChannel) return;

		const logChannel = stage.guild?.channels.resolve(guildSettingsInfoLogs.infoLogChannel) as BaseGuildTextChannel;
		const auditLogEntry = await getAuditLogEntry(AuditLogEvent.StageInstanceUpdate, stage.guild as Guild);

		return this.container.client.emit(CustomEvents.GuildLogCreate, logChannel, this.generateGuildLog(oldStage, stage, auditLogEntry));
	}

	private generateGuildLog(oldStage: StageInstance, stage: StageInstance, auditLogEntry: GuildAuditLogsEntry | null) {
		if (!stage.channel || !stage.guild) return [];

		// Build Main Embed
		const embed = new GuildLogEmbed()
			.setTitle('Stage Instance Updated')
			.setDescription(`${stage.channel.url}${stage.topic ? `: ${stage.topic}` : ''}`)
			.setThumbnail(stage.guild.iconURL())
			.setFooter({ text: `Stage ID: ${stage.id}` })
			.setType(Events.StageInstanceUpdate);

		// Linked Event
		if (oldStage.guildScheduledEventId !== stage.guildScheduledEventId) {
			if (!oldStage.guildScheduledEventId) embed.addBlankFields({ name: 'Stage Event Added', value: `[${stage.guildScheduledEvent?.name as string}](${stage.guildScheduledEvent?.url as string})`, inline: true });
			if (!stage.guildScheduledEventId) embed.addBlankFields({ name: 'Stage Event Removed', value: `[${oldStage.guildScheduledEvent?.name as string}](${oldStage.guildScheduledEvent?.url as string})`, inline: true });
			if (oldStage.guildScheduledEventId && stage.guildScheduledEventId) embed.addBlankFields({ name: 'Stage Event Changed', value: `[${oldStage.guildScheduledEvent?.name as string}](${oldStage.guildScheduledEvent?.url as string}) -> [${stage.guildScheduledEvent?.name as string}](${stage.guildScheduledEvent?.url as string})`, inline: true });
		}

		// Topic
		if (oldStage.topic !== stage.topic) {
			if (!oldStage.topic) embed.addBlankFields({ name: 'Topic Added', value: stage.topic as string, inline: true });
			if (!stage.topic) embed.addBlankFields({ name: 'Topic Removed', value: oldStage.topic as string, inline: true });
			if (oldStage.topic && stage.topic) embed.addBlankFields({ name: 'Topic Changed', value: `\`\`\`diff\n-${oldStage.topic}\n+${stage.topic}\n\`\`\``, inline: false });
		}

		// Privacy Level
		const privacyLevels = ['', 'Public', 'Members only'];
		if (oldStage.privacyLevel !== stage.privacyLevel) {
			if (!oldStage.privacyLevel) embed.addBlankFields({ name: 'Privacy Level Added', value: privacyLevels[stage.privacyLevel], inline: true });
			if (!stage.privacyLevel) embed.addBlankFields({ name: 'Privacy Level Removed', value: privacyLevels[oldStage.privacyLevel], inline: true });
			if (oldStage.topic && stage.topic) embed.addBlankFields({ name: 'Privacy Level Changed', value: `\`\`\`diff\n-${privacyLevels[oldStage.privacyLevel]}\n+${privacyLevels[stage.privacyLevel]}\n\`\`\``, inline: false });
		}

		// Add audit log info to embed
		if (auditLogEntry) {
			if (!isNullish(auditLogEntry.reason)) embed.addBlankFields({ name: 'Reason', value: auditLogEntry.reason, inline: false });
			if (!isNullish(auditLogEntry.executor)) embed.addBlankFields({ name: 'Edited By', value: auditLogEntry.executor.toString(), inline: false });
		}

		return embed.data.fields?.length ? [embed] : [];
	}
}
