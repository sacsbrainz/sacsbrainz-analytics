import { Elysia, t } from "elysia";
import { Reader } from "@maxmind/geoip2-node";
import { extractCountry, extractCountryIsoCode } from "~/utils/utils";
import parser from "ua-parser-js";
import { prisma } from "~/libs/prisma";

export const home = (app: Elysia) =>
  app
    .get("/", () => "Hello World")
    .post(
      "/",
      async ({ request, body, set }) => {
        try {
          const geo = await Reader.open("country.mmdb", {});
          let ip = request.headers.get("x-forwarded-for") || "149.102.229.225";
          if (!ip) {
            set.status = 400;
            return "Something went wrong";
          }

          // handle edge cases where ip is an array or has a comma
          if (Array.isArray(ip)) {
            ip = ip[0] as string;
          }

          if (ip?.includes(",")) {
            ip = ip.split(",")[0] as string;
          }

          const country = await extractCountry(ip, geo);
          const countryIsoCode = await extractCountryIsoCode(ip, geo);

          const ua = parser(request.headers.get("user-agent") ?? "Unknown");

          const checkWebsiteId = await prisma.websites.findUnique({
            where: {
              id: body.a,
            },
          });

          if (!checkWebsiteId) {
            set.status = 401;
            return "Unauthorized";
          }
          await prisma.$transaction(async (tx) => {
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
                websitesId: checkWebsiteId.id,
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
          return "Something went wrong";
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
          a: t.String(),
        }),
      }
    );
