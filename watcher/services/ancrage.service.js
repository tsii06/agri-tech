import { prisma } from "../prisma/client";

export const getAncrageByRef = async (_ref) => {
    const ancrage = await prisma.ancrage.findUnique({
        where: { refExpedition: _ref }
    })

    return ancrage;
};

export const createAncrage = async (_txHash, _ref) => {
    const ancrage = await prisma.ancrage.create({
        data: { txHash: _txHash, refExpedition: _ref }
    });

    return ancrage;
};