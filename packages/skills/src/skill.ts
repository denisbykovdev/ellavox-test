export type Channel = "telegram" | "whatsapp" | "slack" | "webchat";

export type SessionMessage = {
  from: string;
  text: string;
  at: number;
};

export interface MessageContext {
  channel: Channel;
  sender: string; // channel-specific sender id
  text: string;
  timestampMs: number;
  /** Present when the gateway has a session; existing skills may ignore it. */
  session?: {
    createdAt: number;
    messages: SessionMessage[];
  };
}

export interface SkillResult {
  text: string;
  tags?: string[];
}

export interface Skill {
  name: string;
  description: string;
  run(ctx: MessageContext): Promise<SkillResult>;
}
