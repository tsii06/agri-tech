import express from "express";
import { getFileFromPinata } from "../pinata/watcherPinataReception.js";

const router = express.Router();

/**
 * GET /api/merkle/pinata/get-file/:cid
 * Retourne un fichier depuis pinata par son cid
 */
router.get("/get-file/:cid", async (req, res) => {
  try {
    const cid = req.params.cid;

    if (!cid || cid === "") {
      return res.status(400).json({
        error: "CID non definit",
      });
    }

    res.json(await getFileFromPinata(cid));
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
