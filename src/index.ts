import { PrismaClient } from "@prisma/client";
import { Elysia, t } from "elysia";
import { Reader } from "@maxmind/geoip2-node";
import { extractCountry, extractCountryIsoCode } from "./utils/utils";
import parser from "ua-parser-js";
import { rateLimit } from "elysia-rate-limit";
import cors from "@elysiajs/cors";

const setup = (app: Elysia) => app.decorate("db", new PrismaClient());
const corsUrl =
  process.env.NODE_ENV === "production"
    ? "https://sacsbrainz.com"
    : "http://localhost:3000";
const app = new Elysia()
  .use(setup)
  .use(rateLimit())
  .use(
    cors({
      origin: corsUrl,
    })
  )
  .get("/", ({ request }) => {
    return "Hello World!";
  })
  .post(
    "/",
    async ({ request, body, db, headers, set }) => {
      try {
        const geo = await Reader.open("country.mmdb", {});
        // const ip = "149.102.229.225";
        const ip = request.headers.get("x-forwarded-for");
        if (!ip) {
          set.status = 400;
          throw new Error("Something went wrong");
        }
        const country = await extractCountry(ip, geo);
        const countryIsoCode = await extractCountryIsoCode(ip, geo);
        if (!geo.country(ip)) {
          throw new Error("Something went wrong");
        }
        const ua = parser(request.headers.get("user-agent") ?? "Unknown");

        await db.$transaction(async (tx) => {
          const createAnalytic = await tx.analytic.create({
            data: {
              country,
              countryIsoCode,
              continent: geo.country(ip).continent
                ? geo.country(ip).continent?.names.en
                : "Unknown",
              continentCode: geo.country(ip).continent
                ? geo.country(ip).continent?.code
                : "Unknown",
              os: ua.os.name ?? "Unknown",
              userAgent: request.headers.get("user-agent") ?? "Unknown",
              screenWidth: body.w,
              timestamp: new Date(body.d),
              referrer: body.r ?? request.headers.get("referer") ?? "Unknown",
              browser: ua.browser.name ?? "Unknown",
            },
          });

          for (const [key, value] of Object.entries(body.p)) {
            await tx.analyticPage.create({
              data: {
                page: key,
                rank: value[0],
                timeSpent: value[1],
                analytic: {
                  connect: {
                    id: createAnalytic.id,
                  },
                },
              },
            });
          }
        });
      } catch (error) {
        console.log(error);
        set.status = 500;
        throw new Error("Something went wrong");
      }
      set.status = 200;
      return "success";
    },
    {
      body: t.Object({
        d: t.String(),
        r: t.Any(),
        w: t.Number(),
        p: t.Record(t.String(), t.Array(t.Number(), t.Number())),
      }),
    }
  )
  .listen(2020);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
