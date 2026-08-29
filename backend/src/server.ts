import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ mensagem: "API do Almoxarifado no ar." });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API do Almoxarifado rodando em http://localhost:${PORT}`);
});
