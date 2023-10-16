import { GuildLogEmbed } from '#lib/extensions/GuildLogEmbed';
import { getAuditLogEntry } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, type ListenerOptions } from '@sapphire/framework';
import { inlineCodeBlock, isNullish } from '@sapphire/utilities';
import { AuditLogEvent, BaseGuildTextChannel, ChannelType, ThreadChannel, type GuildAuditLogsEntry } from 'discord.js';

@ApplyOptions<ListenerOptions>({ event: Events.ThreadCreate })
export class UserEvent extends Listener {
	public async run(thread: ThreadChannel) {
		if (isNullish(thread.id)) return;

		const guildSettingsInfoLogs = await this.container.prisma.guildSettingsInfoLogs.findUnique({ where: { id: thread.guild.id } });
		if (!guildSettingsInfoLogs?.threadCreateLog || !guildSettingsInfoLogs.infoLogChannel) return;

		const logChannel = thread.guild.channels.resolve(guildSettingsInfoLogs.infoLogChannel) as BaseGuildTextChannel;
		const auditLogEntry = await getAuditLogEntry(AuditLogEvent.ThreadCreate, thread.guild, thread);
		const isForumThread = thread.parent?.type === ChannelType.GuildForum;

		return this.container.client.emit('guildLogCreate', logChannel, this.generateGuildLog(thread, auditLogEntry, isForumThread));
	}

	private generateGuildLog(thread: ThreadChannel, auditLogEntry: GuildAuditLogsEntry | null, isForumThread: boolean) {
		const postOrThread = isForumThread ? 'Post' : 'Thread';
		const embed = new GuildLogEmbed()
			.setAuthor({
				name: thread.name,
				url: `https://discord.com/channels/${thread.guildId}/${thread.id}`,
				iconURL: thread.guild.iconURL() ?? undefined
			})
			.setDescription(inlineCodeBlock(thread.id))
			.setFooter({ text: `${postOrThread} created ${isNullish(auditLogEntry?.executor) ? '' : `by ${auditLogEntry?.executor.username}`}`, iconURL: isNullish(auditLogEntry?.executor) ? undefined : auditLogEntry?.executor?.displayAvatarURL() })
			.setType(Events.ThreadCreate);

		if (thread.parent) embed.addFields({ name: `${thread.parent.type === ChannelType.GuildAnnouncement ? 'Announcement' : 'Text'} channel`, value: `<#${thread.parentId}>`, inline: true });
		if (thread.appliedTags.length && thread.parent?.type === ChannelType.GuildForum) {
			const appliedTags = thread.parent.availableTags.filter(tag => thread.appliedTags.includes(tag.id)).map(tag => `${tag.emoji ? `${thread.guild.emojis.resolve(tag.emoji.id as string)} ` ?? `${tag.emoji.name} ` : ''}${inlineCodeBlock(tag.name)}`).join(' ');
			embed.addFields({ name: 'Applied tags', value: appliedTags });
		}

		if (auditLogEntry) {
			if (!isNullish(auditLogEntry.reason)) embed.addFields({ name: 'Reason', value: auditLogEntry.reason, inline: false });
			if (!isNullish(auditLogEntry.executor)) embed.addFields({ name: 'Created By', value: auditLogEntry.executor.toString(), inline: false });
		}

		return [embed]
	}
}
