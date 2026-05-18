import type { Request, Response } from "express";
import type { ConcessionaireService } from "./concessionaire.service.js";

export class ConcessionaireController {
    constructor(
        private readonly concessionaireService: ConcessionaireService
    ) { }

    listConcessionaires = async (req: Request, res: Response) => {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);

        const r = await this.concessionaireService.listConcessionaires(
            page,
            limit
        );

        return res.status(r.statusCode).json({
            ok: r.ok,
            status: r.status,
            msg: r.msg,
            data: r.data,
            page: r.page,
            limit: r.limit,
            total: r.total,
            totalPages: r.totalPages,
        });
    };
}