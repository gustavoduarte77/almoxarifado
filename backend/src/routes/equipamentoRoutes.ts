import { Router } from "express";
import {
  listarEquipamentos,
  buscarEquipamento,
  criarEquipamento,
  atualizarEquipamento,
  excluirEquipamento,
} from "../controllers/equipamentoController";

const router = Router();

router.get("/", listarEquipamentos);
router.get("/:id", buscarEquipamento);
router.post("/", criarEquipamento);
router.put("/:id", atualizarEquipamento);
router.delete("/:id", excluirEquipamento);

export default router;
