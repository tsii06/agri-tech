import express from "express";
import { getFileFromPinata } from "../pinata/watcherPinataReception.js";
import { ajouterKeyValuesFileIpfs, uploadConsolidatedData } from "../pinata/watcherPinataUpload.js";

const router = express.Router();

/**
 * GET /api/pinata/get-file/:cid
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

/**
 * POST /api/pinata/upload-consolidated-data
 * Retourne un fichier depuis pinata par son cid
 */
router.post("/upload-consolidated-data", async (req, res) => {
  try {
    const { data } = req.body;

    res.json(await uploadConsolidatedData(data.donnee, data.type, data.metadata));
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/pinata/ajout-key-values
 * Retourne un fichier depuis pinata par son cid
 */
router.post("/ajout-key-values", async (req, res) => {
  try {
    const { data } = req.body;

    res.json(await ajouterKeyValuesFileIpfs(data.cid, data.keyvalues));
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
