import type { GuildMember, User } from '@satorijs/protocol';

declare module '@satorijs/protocol' {
  interface Event {
    /** 当前消息发送者的聚合身份信息 */
    author?: User & GuildMember;
  }
}
