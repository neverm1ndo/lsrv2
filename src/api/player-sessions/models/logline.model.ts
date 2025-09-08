import { model, Schema } from "mongoose";
import z from "zod";

export type LogTimeObject = z.infer<typeof LogTimeSchema>;
export type LogPlayer = z.infer<typeof LogPlayerSchema>;
export type LogSerialNumbers = z.infer<typeof LogSerialsSchema>;
export type LogSubject = z.infer<typeof LogSubjectSchema>;
export type LogEditorAction = z.infer<typeof EditorActionSchema>;
export type LogLine = z.infer<typeof LogLineSchema>;

export const LogTimeSchema = z.object({
	hours: z.number().optional(),
	minutes: z.number().optional(),
	seconds: z.number().optional()
});

export const LogPlayerSchema = z.object({
	nickname: z.string(),
	id: z.number()
});

export const LogSerialsSchema = z.object({
	country: z.string(),
	cn: z.string(),
	cc: z.string(),
	id: z.string(),
	as: z.number(),
	ss: z.string(),
	org: z.string(),
	cli: z.string()
});

export const LogSubjectSchema = LogPlayerSchema.extend({
	admin: z
		.object({
			id: z.number(),
			name: z.string()
		})
		.optional(),
	role: z.enum(["Администратор", "Игрок", "Разработчик"]).optional()
});

export const EditorActionSchema = z
	.object({
		editor_id: z.number(),
		group: z.enum(["owner", "guest"])
	})
	.catchall(z.union([z.string(), z.number()]));

export const LogLineSchema = z.object({
	unix: z.number(),
	date: z.string(),
	process: z.string(),
	user: LogPlayerSchema,
	time: LogTimeSchema.optional(),
	numbers: z.number().array().optional(),
	subject: LogSubjectSchema.optional(),
	death: z.string().optional(),
	message: z.string().optional(),
	serials: LogSerialsSchema.partial().optional(),
	editor: EditorActionSchema.optional()
});

const MLogTimeSchema = new Schema(
	{
		hours: { type: Number },
		minutes: { type: Number },
		seconds: { type: Number }
	},
	{ _id: false }
);

const MLogPlayerSchema = new Schema(
	{
		nickname: { type: String, required: true },
		id: { type: Number }
	},
	{ _id: false }
);

const MLogSerialsSchema = new Schema(
	{
		country: { type: String },
		cn: { type: String },
		cc: { type: String },
		id: { type: String },
		as: { type: Number },
		ss: { type: String },
		org: { type: String },
		cli: { type: String }
	},
	{ _id: false }
);

const MLogSubjectSchema = new Schema(
	{
		nickname: { type: String, required: true },
		id: { type: Number, required: true },
		admin: {
			type: {
				id: { type: Number, required: true },
				name: { type: String, required: true }
			},
			required: false
		},
		role: {
			type: String,
			enum: ["Администратор", "Игрок", "Разработчик"],
			required: false
		}
	},
	{ _id: false }
);

/**
 * EditorAction:
 * - определены обязательные поля editor_id и group
 * - допускаются произвольные дополнительные ключи (string -> string|number)
 *   Для этого вложенная схема создаётся с опцией strict: false.
 */
const MEditorActionSchema = new Schema(
	{
		editor_id: { type: Number, required: true },
		group: { type: String, enum: ["owner", "guest"], required: true }
	},
	{ _id: false, strict: false } // strict:false позволяет сохранять дополнительные ключи
);

const MLogLineSchema = new Schema<LogLine & { multi?: number }>(
	{
		unix: { type: Number, required: true },
		date: { type: String, required: true },
		process: { type: String, required: true },
		user: { type: MLogPlayerSchema, required: true },
		time: { type: MLogTimeSchema },
		numbers: { type: [Number], default: undefined },
		subject: { type: MLogSubjectSchema },
		death: { type: String },
		message: { type: String },
		serials: { type: MLogSerialsSchema },
		editor: { type: MEditorActionSchema },
		multi: { type: Number, default: undefined }
	},
	{
		// по умолчанию _id генерируется для документов; вложенные схемы уже выключают _id где нужно
		timestamps: false
	}
);

export const LogLineModel = model<LogLine>("LogLine", MLogLineSchema);
