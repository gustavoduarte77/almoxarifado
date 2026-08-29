import { Router } from "express";
import {
  listarEmprestimos,
  listarAtrasados,
  buscarEmprestimo,
  criarEmprestimo,
  registrarDevolucao,
} from "../controllers/emprestimoController";

const router = Router();

// IMPORTANTE: rota estática "/atrasados" deve vir ANTES da rota dinâmica "/:id"
router.get("/atrasados", listarAtrasados);
router.get("/", listarEmprestimos);
router.get("/:id", buscarEmprestimo);
router.post("/", criarEmprestimo);
router.put("/:id/devolucao", registrarDevolucao);

export default router;
