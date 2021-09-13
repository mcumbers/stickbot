import { FT, T } from '#lib/types';

export const ChoiceDescription = T<string>('commands/user:choice.description');
export const ChoiceTooFew = T<string>('commands/user:choice.responses.tooFew');
export const CoinflipDescription = T<string>('commands/user:coinflip.description');
export const CoinflipHeads = T<string>('commands/user:coinflip.responses.heads');
export const CoinflipTails = T<string>('commands/user:coinflip.responses.tails');
export const EightballDescription = T<string>('commands/user:8ball.description');
export const EightballNoQuestion = T<string>('commands/user:8ball.responses.noQuestion');
export const EightballAnswers = T<readonly string[]>('commands/user:8ball.responses.answers');
export const EnlargeDescription = T<string>('commands/user:enlarge.description');
export const EnlargeNoneSpecified = T<string>('commands/user:enlarge.responses.noneSpecified');
export const EnlargeInvalidInput = FT<{ input: string }>('commands/user:enlarge.responses.invalidInput');
export const InfoDescription = T<string>('commands/user:info.description');
export const InfoEmbedTitle = T<string>('commands/user:info.embed.title');
export const InfoEmbedDescription = T<string>('commands/user:info.embed.description');
export const InfoEmbedTeamTitle = T<string>('commands/user:info.embed.fields.team.title');
export const InfoEmbedTeamContent = T<string>('commands/user:info.embed.fields.team.content');
export const InfoEmbedVersion = T<string>('commands/user:info.embed.fields.version');
export const InfoEmbedLinksTitle = T<string>('commands/user:info.embed.fields.links.title');
export const InfoEmbedLinksContent = T<string>('commands/user:info.embed.fields.links.content');
export const InviteDescription = T<string>('commands/user:invite.description');
export const InviteEmbedTitle = T<string>('commands/user:invite.embed.title');
export const InviteEmbedDescription = T<string>('commands/user:invite.embed.description');
export const PingDescription = T<string>('commands/user:ping.description');
export const Ping = T<string>('commands/user:ping.responses.ping');
export const PingPong = FT<{ diff: number; ping: number }, string>('commands/user:ping.responses.pong');
export const QuoteDescription = T<string>('commands/user:quote.description');
export const QuoteEmbedFooter = FT<{ channel: string }, string>('commands/user:quote.embed.footer');
