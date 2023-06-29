import { Elysia, t } from "elysia";
import { setup } from "~/index";
import { prisma } from "~/libs/prisma";
import { isAuthenticated } from "~/middlewares/auth";

interface Count {
  key: string;
  total: number;
}
interface PageCount {
  page: string;
  count: number;
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
          },
        });
        const pageViewsCount = await prisma.analyticPage.count({
          where: {
            createdAt: {
              gte: new Date(query.from),
              lte: new Date(query.to),
            },
          },
        });
        return {
          success: true,
          message: "Fetch authenticated user details",
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

        const filteredVisitors = await prisma.analytic.findMany({
          where: {
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
          },
          select: {
            createdAt: true,
          },
        });

        const visitorsCounts: Count[] = [];
        const currentDate = new Date(fromDate);

        while (currentDate <= toDate) {
          const formattedDate = currentDate.toISOString().split("T")[0];
          const count = filteredVisitors.filter((visitor) => {
            const visitorDate = visitor.createdAt.toISOString().split("T")[0];
            return visitorDate === formattedDate;
          }).length;

          visitorsCounts.push({
            key: formattedDate,
            total: count,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        const filteredPageViews = await prisma.analyticPage.findMany({
          where: {
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
          },
          select: {
            createdAt: true,
          },
        });

        const pageViewsCounts: Count[] = [];
        const currentDatePageViews = new Date(fromDate);

        while (currentDatePageViews <= toDate) {
          const formattedDate = currentDatePageViews
            .toISOString()
            .split("T")[0];
          const count = filteredPageViews.filter((pageView) => {
            const pageViewDate = pageView.createdAt.toISOString().split("T")[0];
            return pageViewDate === formattedDate;
          }).length;

          pageViewsCounts.push({
            key: formattedDate,
            total: count,
          });

          currentDatePageViews.setDate(currentDatePageViews.getDate() + 1);
        }

        await prisma.$disconnect();

        return {
          success: true,
          message: "Fetch authenticated user details",
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

        // const startDate = new Date("1970-01-01T00:00:00.000Z");
        // const endDate = new Date("2023-06-29T00:10:06.318Z");

        const startDate = new Date(query.from);
        const endDate = new Date(query.to);

        const filteredPrismaData = await prisma.analyticPage.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            page: "asc",
          },
          select: {
            page: true,
          },
        });

        const getPageCountArray = (
          data: { page: string }[]
        ): { page: string; count: number }[] => {
          const pageCountMap: { [page: string]: number } = {};

          data.forEach((item) => {
            const { page } = item;
            if (pageCountMap[page]) {
              pageCountMap[page]++;
            } else {
              pageCountMap[page] = 1;
            }
          });

          const result: { page: string; count: number }[] = [];
          for (const page in pageCountMap) {
            result.push({ page, count: pageCountMap[page] });
          }

          return result.sort((a, b) => b.count - a.count);
        };

        const filteredData = getPageCountArray(filteredPrismaData);

        return {
          success: true,
          message: "Fetch authenticated user details",
          data: filteredData,
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
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

        const filteredPrismaData = await prisma.analytic.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            referrer: "asc",
          },
          select: {
            referrer: true,
          },
        });

        const getPageCountArray = (
          data: { referrer: string }[]
        ): { referrer: string; count: number }[] => {
          const CountMap: { [referrer: string]: number } = {};

          data.forEach((item) => {
            const { referrer } = item;
            if (CountMap[referrer]) {
              CountMap[referrer]++;
            } else {
              CountMap[referrer] = 1;
            }
          });

          const result: { referrer: string; count: number }[] = [];
          for (const referrer in CountMap) {
            result.push({ referrer, count: CountMap[referrer] });
          }

          return result.sort((a, b) => b.count - a.count);
        };

        const filteredData = getPageCountArray(filteredPrismaData);

        return {
          success: true,
          message: "Fetch authenticated user details",
          data: filteredData,
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
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

        const filteredPrismaData = await prisma.analytic.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            referrer: "asc",
          },
          select: {
            referrer: true,
          },
        });

        const getPageCountArray = (
          data: { referrer: string }[]
        ): { referrer: string; count: number }[] => {
          const CountMap: { [referrer: string]: number } = {};

          data.forEach((item) => {
            const { referrer } = item;
            if (CountMap[referrer]) {
              CountMap[referrer]++;
            } else {
              CountMap[referrer] = 1;
            }
          });

          const result: { referrer: string; count: number }[] = [];
          for (const referrer in CountMap) {
            result.push({ referrer, count: CountMap[referrer] });
          }

          return result.sort((a, b) => b.count - a.count);
        };

        const filteredData = getPageCountArray(filteredPrismaData);

        return {
          success: true,
          message: "Fetch authenticated user details",
          data: filteredData,
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
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

        const filteredPrismaData = await prisma.analytic.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            country: "asc",
          },
          select: {
            country: true,
          },
        });

        const getPageCountArray = (
          data: { country: string }[]
        ): { country: string; count: number }[] => {
          const CountMap: { [country: string]: number } = {};

          data.forEach((item) => {
            const { country } = item;
            if (CountMap[country]) {
              CountMap[country]++;
            } else {
              CountMap[country] = 1;
            }
          });

          const result: { country: string; count: number }[] = [];
          for (const country in CountMap) {
            result.push({ country, count: CountMap[country] });
          }

          return result.sort((a, b) => b.count - a.count);
        };

        const filteredData = getPageCountArray(filteredPrismaData);

        return {
          success: true,
          message: "Fetch authenticated user details",
          data: filteredData,
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
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

        const filteredPrismaData = await prisma.analytic.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            os: "asc",
          },
          select: {
            os: true,
          },
        });

        const getPageCountArray = (
          data: { os: string }[]
        ): { os: string; count: number }[] => {
          const CountMap: { [os: string]: number } = {};

          data.forEach((item) => {
            const { os } = item;
            if (CountMap[os]) {
              CountMap[os]++;
            } else {
              CountMap[os] = 1;
            }
          });

          const result: { os: string; count: number }[] = [];
          for (const os in CountMap) {
            result.push({ os, count: CountMap[os] });
          }

          return result.sort((a, b) => b.count - a.count);
        };

        const filteredData = getPageCountArray(filteredPrismaData);

        return {
          success: true,
          message: "Fetch authenticated user details",
          data: filteredData,
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
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

        const filteredPrismaData = await prisma.analytic.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            browser: "asc",
          },
          select: {
            browser: true,
          },
        });

        const getPageCountArray = (
          data: { browser: string }[]
        ): { browser: string; count: number }[] => {
          const CountMap: { [browser: string]: number } = {};

          data.forEach((item) => {
            const { browser } = item;
            if (CountMap[browser]) {
              CountMap[browser]++;
            } else {
              CountMap[browser] = 1;
            }
          });

          const result: { browser: string; count: number }[] = [];
          for (const browser in CountMap) {
            result.push({ browser, count: CountMap[browser] });
          }

          return result.sort((a, b) => b.count - a.count);
        };

        const filteredData = getPageCountArray(filteredPrismaData);

        return {
          success: true,
          message: "Fetch authenticated user details",
          data: filteredData,
        };
      },
      {
        query: t.Object({
          from: t.String(),
          to: t.String(),
        }),
      }
    );
