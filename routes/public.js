const express = require("express");
const routes = express.Router();

const publicController = require("../controller/public");

routes.get("/", publicController.startApi);
routes.post("/api/v1/media", publicController.postMedia);
routes.post("/api/v1/download-direct", publicController.downloadDirectMedia);
routes.get("/api/v1/proxy-image", publicController.proxyImage);

module.exports = routes;