import { Router } from "express";
import {
  listarAlunos,
  buscarAluno,
  criarAluno,
  atualizarAluno,
  excluirAluno,
} from "../controllers/alunoController";

const router = Router();

router.get("/", listarAlunos);
router.get("/:id", buscarAluno);
router.post("/", criarAluno);
router.put("/:id", atualizarAluno);
router.delete("/:id", excluirAluno);

export default router;
