import { z } from "zod";

export const postSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题不能超过200字"),
  slug: z
    .string()
    .min(1, "路径不能为空")
    .max(200, "路径不能超过200字")
    .regex(/^[a-z0-9-]+$/, "路径只能包含小写字母、数字和连字符"),
  summary: z.string().max(500, "摘要不能超过500字").optional(),
  content: z.string().min(1, "内容不能为空"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  tagIds: z.array(z.string()).default([]),
  newTags: z.array(z.string()).default([]),
});

export const commentSchema = z.object({
  nickname: z.string().min(1, "昵称不能为空").max(50, "昵称不能超过50字"),
  email: z.string().email("请输入有效的邮箱地址").max(100, "邮箱不能超过100字"),
  website: z
    .string()
    .max(200, "网站地址不能超过200字")
    .url("请输入有效的URL")
    .optional()
    .or(z.literal("")),
  content: z.string().min(1, "评论内容不能为空").max(2000, "评论内容不能超过2000字"),
  parentId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱"),
  password: z.string().min(1, "密码不能为空"),
});

export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
