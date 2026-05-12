const express = require("express");

const routes = express.Router();

const publicController = require("../controller/public");

// Test API route
// Full URL: GET /api/v1/
routes.get("/", publicController.startApi);

// Prepare media info / qualities
// Full URL: POST /api/v1/media
routes.post("/media", publicController.postMedia);

// Direct download selected media
// Full URL: POST /api/v1/download-direct
routes.post("/download-direct", publicController.downloadDirectMedia);

// Proxy image / thumbnail
// Full URL: GET /api/v1/proxy-image?url=IMAGE_URL
routes.get("/proxy-image", publicController.proxyImage);

module.exports = routes;