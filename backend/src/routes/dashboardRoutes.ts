import { Router } from "express";
import { resumoDashboard, atrasadosDashboard } from "../controllers/dashboardController";

const router = Router();

router.get("/resumo", resumoDashboard);
router.get("/atrasados", atrasadosDashboard);

export default router;
