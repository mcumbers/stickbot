import { GuildLogEmbed } from '#lib/extensions/GuildLogEmbed';
import { CustomEvents } from '#utils/CustomTypes';
import { getAuditLogEntry } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, type ListenerOptions } from '@sapphire/framework';
import { inlineCodeBlock, isNullish } from '@sapphire/utilities';
import { AuditLogEvent, BaseGuildTextChannel, ChannelType, ThreadChannel, type GuildAuditLogsEntry } from 'discord.js';

@ApplyOptions<ListenerOptions>({ event: Events.ThreadCreate })
export class UserEvent extends Listener {
	public async run(thread: ThreadChannel) {
		if (isNullish(thread.id)) return;

		const guildSettingsInfoLogs = await this.container.prisma.guildSettingsInfoLogs.fetch(thread.guild.id);
		if (!guildSettingsInfoLogs?.threadCreateLog || !guildSettingsInfoLogs.infoLogChannel) return;

		const logChannel = thread.guild.channels.resolve(guildSettingsInfoLogs.infoLogChannel) as BaseGuildTextChannel;
		const auditLogEntry = await getAuditLogEntry(AuditLogEvent.ThreadCreate, thread.guild, thread);

		return this.container.client.emit(CustomEvents.GuildLogCreate, logChannel, this.generateGuildLog(thread, auditLogEntry));
	}

	private generateGuildLog(thread: ThreadChannel, auditLogEntry: GuildAuditLogsEntry | null) {
		const threadDescriptor = thread.parent?.type === ChannelType.GuildForum ? 'Post' : 'Thread';
		const parentDescriptor = thread.parent?.type === ChannelType.GuildForum ? 'Forum' : 'Channel';

		const embed = new GuildLogEmbed()
			.setTitle(`${threadDescriptor} Created`)
			.setDescription(`${thread.url}`)
			.setThumbnail(thread.guild.iconURL())
			.setFooter({ text: `Thread ID: ${thread.id}` })
			.setType(Events.ThreadCreate);

		if (thread.parent) embed.addBlankFields({ name: `In ${parentDescriptor}`, value: thread.parent.url, inline: true });

		if (thread.appliedTags.length && thread.parent?.type === ChannelType.GuildForum) {
			const appliedTags = thread.parent.availableTags.filter(tag => thread.appliedTags.includes(tag.id)).map(tag => `${tag.emoji ? `${thread.guild.emojis.resolve(tag.emoji.id as string) || tag.emoji.name} ` : ''}${inlineCodeBlock(tag.name)}`).join(' ');
			embed.addBlankFields({ name: 'Applied tags', value: appliedTags });
		}

		if (auditLogEntry) {
			if (!isNullish(auditLogEntry.reason)) embed.addBlankFields({ name: 'Reason', value: auditLogEntry.reason, inline: false });
			if (!isNullish(auditLogEntry.executor)) embed.addBlankFields({ name: 'Created By', value: auditLogEntry.executor.toString(), inline: false });
		}

		return [embed]
	}
}
