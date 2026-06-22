import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { ensureAuthTables } from "./services/authSchema.js";
import authRouter from "./routes/auth.js";
import produtosRouter from "./routes/produtos.js";
import cadastroRouter from "./routes/cadastro.js";
import adminRouter from "./routes/admin.js";
import dashboardRouter from "./routes/dashboard.js";
import preparacaoRouter from "./routes/preparacao.js";
import operacionalRouter from "./routes/operacional.js";
import logisticaRouter from "./routes/logistica.js";
import estoqueRouter from "./routes/estoque.js";
import relatoriosRouter from "./routes/relatorios.js";

const app = express();

app.use(cors());
app.use(express.json());

await ensureAuthTables();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sga-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/produtos", produtosRouter);
app.use("/api/cadastro", cadastroRouter);
app.use("/api/admin", adminRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/preparacao", preparacaoRouter);
app.use("/api/operacional", operacionalRouter);
app.use("/api/logistica", logisticaRouter);
app.use("/api/estoque", estoqueRouter);
app.use("/api/relatorios", relatoriosRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: "Erro interno",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(config.port, () => {
  console.log(`sga-api ouvindo em http://localhost:${config.port}`);
});
