const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const analytics = await prisma.analytic.findMany({});
  console.log("analytic fetched");
  analytics.map(async (analytic) => {
    await prisma.analytic.update({
      data: {
        websitesId: "",
      },
      where: {
        id: analytic.id,
      },
    });
    console.log("updating");
  });
  console.log("done");
}
main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
