import { Request, Response, NextFunction } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Erro não tratado:", err);
  res.status(500).json({ mensagem: "Erro interno do servidor." });
}
