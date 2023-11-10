import Elysia, { t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { auth } from "./routes/auth";
import { home } from "./routes/home";
import { rateLimit } from "elysia-rate-limit";
import cors from "@elysiajs/cors";
import { analytic } from "./routes/analytic";
import staticPlugin from "@elysiajs/static";

const corsUrl =
  process.env.NODE_ENV === "production"
    ? /^(?:https?:\/\/)?(?:\w+\.)?sacsbrainz\.com$/
    : /localhost/;

export const setup = (app: Elysia) =>
  app
    .use(
      jwt({
        name: "jwt",
        secret: Bun.env.JWT_SECRET!,
        exp: "15m",
      })
    )
    .use(cookie());

const app = new Elysia()
  .use(
    rateLimit({
      max: 60,
    })
  )
  .use(
    cors({
      origin: corsUrl,
      credentials: true,
      allowedHeaders: ["Content-Type"],
    })
  )
  .use(setup)
  .use(
    staticPlugin({
      prefix: "/",
    })
  )
  .use(auth)
  .use(home)
  .use(analytic)
  .listen(2020);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
