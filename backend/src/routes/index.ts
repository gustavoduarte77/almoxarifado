import { Router } from "express";
import alunoRoutes from "./alunoRoutes";
import equipamentoRoutes from "./equipamentoRoutes";
import emprestimoRoutes from "./emprestimoRoutes";
import dashboardRoutes from "./dashboardRoutes";

const router = Router();

router.use("/alunos", alunoRoutes);
router.use("/equipamentos", equipamentoRoutes);
router.use("/emprestimos", emprestimoRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
