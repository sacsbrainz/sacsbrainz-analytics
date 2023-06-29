import { Elysia } from "elysia";
import { prisma } from "~/libs/prisma";
import { setup } from "..";
 

export const isAuthenticated = (app: Elysia) =>
  app
  .use(setup)
  .derive(async ({ cookie, jwt, set }) => {
    if (!cookie!.access_token) {
      set.status = 401;
      return {
        success: false,
        message: "Unauthorized",
        data: null,
      };
    }
    const { userId } = await jwt.verify(cookie!.access_token);
    if (!userId) {
      set.status = 401;
      return {
        success: false,
        message: "Unauthorized",
        data: null,
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      set.status = 401;
      return {
        success: false,
        message: "Unauthorized",
        data: null,
      };
    }
    return {
      user,
    };
  });