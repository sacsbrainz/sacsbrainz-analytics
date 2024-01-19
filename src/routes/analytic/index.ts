import { Elysia, t } from "elysia";
import { setup } from "~/index";
import { prisma } from "~/libs/prisma";
import { isAuthenticated } from "~/middlewares/auth";

interface Count {
  key: string;
  total: number;
}

export const analytic = (app: Elysia) =>
  app
    .use(setup)
    .use(isAuthenticated)
    // protected route
    .get(
      "/stats",
      async ({ user, query }) => {
        if (!user) {
          return {
            success: false,
            message: "Unauthorized",
            data: null,
          };
        }

        const visitorsCount = await prisma.analytic.count({
          where: {
            createdAt: {
              gte: new Date(query.from),
              lte: new Date(query.to),
            },
            AND: {
              websitesId: query.id,
            },
          },
        });
        const pageViewsCount = await prisma.analyticPage.count({
          where: {
            createdAt: {
              gte: new Date(query.from),
              lte: new Date(query.to),
            },
            AND: {
              analytic: {
                websitesId: query.id,
              },
            },
          },
        });
        return {
          success: true,
          message: "Fetched stats",
          data: {
            visitorsCount,
            pageViewsCount,
          },
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
          id: t.String(),
        }),
      }
    )
    .get(
      "/timeseries",
      async ({ user, query }) => {
        if (!user) {
          return {
            success: false,
            message: "Unauthorized",
            data: null,
          };
        }

        const fromDate = new Date(query.from);
        const toDate = new Date(query.to);

        const visitors = await prisma.analytic.findMany({
          where: {
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
            websitesId: query.id,
          },
          select: {
            createdAt: true,
          },
        });

        const pageViews = await prisma.analyticPage.findMany({
          where: {
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
            analytic: {
              websitesId: query.id,
            },
          },
          select: {
            createdAt: true,
          },
        });

        const visitorsCounts: Count[] = [];
        const pageViewsCounts: Count[] = [];

        const counts: {
          [key: string]: { visitors: number; pageViews: number };
        } = {};

        for (const visitor of visitors) {
          const date = visitor.createdAt.toISOString().split("T")[0];
          if (!counts[date]) {
            counts[date] = { visitors: 0, pageViews: 0 };
          }
          counts[date].visitors++;
        }

        for (const pageView of pageViews) {
          const date = pageView.createdAt.toISOString().split("T")[0];
          if (!counts[date]) {
            counts[date] = { visitors: 0, pageViews: 0 };
          }
          counts[date].pageViews++;
        }

        for (const [key, { visitors, pageViews }] of Object.entries(counts)) {
          visitorsCounts.push({ key, total: visitors });
          pageViewsCounts.push({ key, total: pageViews });
        }

        return {
          success: true,
          message: "Fetched timeseries",
          data: {
            visitors: visitorsCounts,
            pageViews: pageViewsCounts,
          },
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
          id: t.String(),
        }),
      }
    )
    .get(
      "/top-pages",
      async ({ user, query }) => {
        if (!user) {
          return {
            success: false,
            message: "Unauthorized",
            data: null,
          };
        }

        const startDate = new Date(query.from);
        const endDate = new Date(query.to);

        const filteredPrismaData = await prisma.analyticPage.groupBy({
          by: ["page"],
          _count: {
            page: true,
          },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            analytic: {
              websitesId: query.id,
            },
          },
          orderBy: {
            _count: {
              page: "desc",
            },
          },
        });
        const filteredData = filteredPrismaData.map((item) => ({
          page: item.page,
          count: item._count.page,
        }));

        return {
          success: true,
          message: "Fetched top pages",
          data: filteredData,
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
          id: t.String(),
        }),
      }
    )
    .get(
      "/top-referrers",
      async ({ user, query }) => {
        if (!user) {
          return {
            success: false,
            message: "Unauthorized",
            data: null,
          };
        }

        const startDate = new Date(query.from);
        const endDate = new Date(query.to);

        const filteredPrismaData = await prisma.analytic.groupBy({
          by: ["referrer"],
          _count: {
            referrer: true,
          },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            websitesId: query.id,
          },
          orderBy: {
            _count: {
              referrer: "desc",
            },
          },
        });

        const filteredData = filteredPrismaData.map((item) => ({
          referrer: item.referrer,
          count: item._count.referrer,
        }));

        return {
          success: true,
          message: "Fetched top referrers",
          data: filteredData,
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
          id: t.String(),
        }),
      }
    )
    .get(
      "/countries",
      async ({ user, query }) => {
        if (!user) {
          return {
            success: false,
            message: "Unauthorized",
            data: null,
          };
        }

        const startDate = new Date(query.from);
        const endDate = new Date(query.to);

        const filteredPrismaData = await prisma.analytic.groupBy({
          by: ["country"],
          _count: {
            country: true,
          },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            websitesId: query.id,
          },
          orderBy: {
            _count: {
              country: "desc",
            },
          },
        });
        const filteredData = filteredPrismaData.map((item) => ({
          country: item.country,
          count: item._count.country,
        }));
        return {
          success: true,
          message: "Fetched countries",
          data: filteredData,
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
          id: t.String(),
        }),
      }
    )
    .get(
      "/os",
      async ({ user, query }) => {
        if (!user) {
          return {
            success: false,
            message: "Unauthorized",
            data: null,
          };
        }

        const startDate = new Date(query.from);
        const endDate = new Date(query.to);

        const filteredPrismaData = await prisma.analytic.groupBy({
          by: ["os"],
          _count: {
            os: true,
          },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            websitesId: query.id,
          },
          orderBy: {
            _count: {
              os: "desc",
            },
          },
        });

        const filteredData = filteredPrismaData.map((item) => ({
          os: item.os,
          count: item._count.os,
        }));
        return {
          success: true,
          message: "Fetched os",
          data: filteredData,
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
          id: t.String(),
        }),
      }
    )
    .get(
      "/browser",
      async ({ user, query }) => {
        if (!user) {
          return {
            success: false,
            message: "Unauthorized",
            data: null,
          };
        }

        const startDate = new Date(query.from);
        const endDate = new Date(query.to);

        const filteredPrismaData = await prisma.analytic.groupBy({
          by: ["browser"],
          _count: {
            browser: true,
          },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            websitesId: query.id,
          },
          orderBy: {
            _count: {
              browser: "desc",
            },
          },
        });

        const filteredData = filteredPrismaData.map((item) => ({
          browser: item.browser,
          count: item._count.browser,
        }));

        return {
          success: true,
          message: "Fetched browser",
          data: filteredData,
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
          id: t.String(),
        }),
      }
    )
    .post(
      "/add-website",
      async ({ body, set, request, user }) => {
        if (!user) {
          return {
            success: false,
            message: "Unauthorized",
            data: null,
          };
        }

        const secret = request.headers.get("x-secret");
        if (secret !== Bun.env.SECRET) {
          set.status = 401;
          return {
            success: false,
            data: null,
            message: "Unauthorized",
          };
        }
        const { url } = body;

        const newWebsite = await prisma.websites.create({
          data: {
            url,
          },
        });

        await prisma.logs.create({
          data: {
            userId: user.id,
            action: "CREATED_NEW_WEBSITE",
          },
        });

        return {
          success: true,
          message: "Website created",
          data: {
            website: newWebsite,
          },
        };
      },
      {
        body: t.Object({
          url: t.String(),
        }),
      }
    )
    .get("/get-websites", async ({ user }) => {
      if (!user) {
        return {
          success: false,
          message: "Unauthorized",
          data: null,
        };
      }

      const websites = await prisma.websites.findMany({
        include: {
          _count: {
            select: {
              analytic: true,
            },
          },
        },
      });

      return {
        success: true,
        message: "Fetched websites",
        data: {
          websites,
        },
      };
    })
    .get(
      "/get-website/:id",
      async ({ user, params: { id } }) => {
        if (!user) {
          return {
            success: false,
            message: "Unauthorized",
            data: null,
          };
        }

        const website = await prisma.websites.findUnique({
          where: { id },
        });

        return {
          success: true,
          message: "Fetched websites",
          data: website,
        };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      }
    );
