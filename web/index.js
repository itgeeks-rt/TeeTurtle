// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

// import  router  from "./server/routes/index.js"
import router from './server/routes/index.js';
import {authenticateUser} from "./server/middlewares/authenticateUser.js";

import bodyParser from "body-parser";
import db from "./server/models/index.js"

import cors from "cors"




const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);



app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.json());
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
app.use(express.urlencoded({ extended: true }));

app.use(cors());


// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

db.sequelize.sync({alter:true})
  .then(() => {
    console.log("Synced  db. databse connection successfull------------");
  })
  .catch((err) => {
    console.log(err, "Failed to sync db ");
  });

app.use("/api/*", shopify.validateAuthenticatedSession());
app.use("/external/*",authenticateUser)
app.use("/external/",router)




app.use(express.json());

app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});
app.get("/api/products/all", async (_req, res) => {
  

 

  res.status(200).send({ response:"all products" });
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));


app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  try {
    const html = readFileSync(join(STATIC_PATH, "index.html"))
      .toString()
      .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "");

    res.status(200).set("Content-Type", "text/html").send(html);
  } catch (error) {
    console.error("Error serving index.html:", error);
    res.status(500).send("Internal Server Error");
  }
});


// app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
//   return res
//     .status(200)
//     .set("Content-Type", "text/html")
//     .send(
//       readFileSync(join(STATIC_PATH, "index.html"))
//         .toString()
//         .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
//     );
// });






app.listen(PORT);
console.log("server listening at port number-------------------------",PORT) 
