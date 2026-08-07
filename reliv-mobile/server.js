import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 5000);
const buildDir = path.join(__dirname, "dist");

app.use(express.static(buildDir, { index: false }));

// Every opaque QR path is handled client-side by MobileEntryGateway.
app.get(/.*/, (_req, res, next) => {
  res.sendFile("index.html", { root: buildDir }, next);
});

app.listen(port, () => {
  console.log(`Reliv mobile service listening on port ${port}`);
});
