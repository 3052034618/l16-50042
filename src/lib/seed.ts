import { prisma } from "./prisma";
import { hashPassword } from "./auth";

export async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL || "admin@blog.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const siteName = process.env.SITE_NAME || "我的博客";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const existingSetting = await prisma.setting.findUnique({
      where: { userId: existing.id },
    });
    if (!existingSetting) {
      await prisma.setting.create({
        data: {
          userId: existing.id,
          siteName,
        },
      });
    }
    return existing;
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      nickname: "管理员",
      settings: {
        create: {
          siteName,
        },
      },
    },
  });

  console.log(`管理员账户已创建: ${email} / ${password}`);
  return user;
}
