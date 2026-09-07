import { z } from "zod";

export const CalendarProvider = z.enum(["GOOGLE", "APPLE_ICLOUD"]);
export type CalendarProvider = z.infer<typeof CalendarProvider>;

export const CalendarSyncMode = z.enum(["FREE_BUSY_ONLY", "FULL_DETAILS"]);
export type CalendarSyncMode = z.infer<typeof CalendarSyncMode>;

export const CalendarConnectionStatus = z.enum(["PENDING", "CONNECTED", "ERROR", "REVOKED"]);
export type CalendarConnectionStatus = z.infer<typeof CalendarConnectionStatus>;

export const PairingStatus = z.enum(["PENDING", "ACTIVE", "REVOKED"]);
export type PairingStatus = z.infer<typeof PairingStatus>;

export const MeetingStatus = z.enum(["PROPOSED", "ACCEPTED", "DECLINED", "CANCELLED"]);
export type MeetingStatus = z.infer<typeof MeetingStatus>;

export const TimezoneProfileSchema = z.object({
  ianaTimezone: z.string().min(1),
  label: z.string().min(1),
  colorHex: z.string().optional(),
});
export type TimezoneProfile = z.infer<typeof TimezoneProfileSchema>;

export const RegisterUserResponseSchema = z.object({
  userId: z.string(),
  token: z.string(),
});
export type RegisterUserResponse = z.infer<typeof RegisterUserResponseSchema>;

export const CreatePairingResponseSchema = z.object({
  pairingId: z.string(),
  inviteCode: z.string(),
  expiresAt: z.string(),
});
export type CreatePairingResponse = z.infer<typeof CreatePairingResponseSchema>;

export const RedeemPairingRequestSchema = z.object({
  inviteCode: z.string().min(1),
});
export type RedeemPairingRequest = z.infer<typeof RedeemPairingRequestSchema>;

export const CalendarConnectionSchema = z.object({
  provider: CalendarProvider,
  syncMode: CalendarSyncMode,
});
export type CalendarConnectionInput = z.infer<typeof CalendarConnectionSchema>;

export const CreateMeetingRequestSchema = z.object({
  pairingId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  title: z.string().optional(),
  notes: z.string().optional(),
  syncToCalendar: z.boolean().default(false),
  reminderOnly: z.boolean().default(true),
});
export type CreateMeetingRequest = z.infer<typeof CreateMeetingRequestSchema>;
