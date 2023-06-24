import { PrismaClient } from "@prisma/client";
import { Elysia } from "elysia";
import { Reader } from "@maxmind/geoip2-node";

const setup = (app: Elysia) => app.decorate("db", new PrismaClient());
const app = new Elysia()
  .use(setup)
  .get("/", ({ request }) => request.headers.toJSON())
  .patch("/", (pro) => pro.request.headers.toJSON())
  .listen(2020);

// request.headers.get('User-Agent'))
// const options = {
//   // you can use options like `cache` or `watchForUpdates`
// };

// Reader.open("country.mmdb", options).then((reader) => {
//   console.log(reader.country("197.210.70.216"));
// });
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
// Typescript:
