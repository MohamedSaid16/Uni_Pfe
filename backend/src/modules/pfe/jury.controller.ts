import { Request, Response } from "express";
import prisma from "../../config/database";
import logger from "../../utils/logger";

/**
 * JURY CONTROLLER
 * Handles PFE jury (defense committee) management
 * Fields: groupId, enseignantId, role
 */

export const createJuryMember = async (req: Request, res: Response) => {
  try {
    const { groupId, enseignantId, role } = req.body;

    if (!groupId || !enseignantId || !role) {
      return res.status(400).json({
        error: "Missing required fields: groupId, enseignantId, role",
      });
    }

    // Validate role
    const validRoles = ["president", "examinateur", "rapporteur"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    const juryMember = await prisma.pfeJury.create({
      data: {
        groupId: parseInt(String(groupId)),
        enseignantId: parseInt(String(enseignantId)),
        role,
      },
      include: {
        group: true,
        enseignant: {
          include: { user: true },
        },
      },
    });

    return res.status(201).json({
      data: juryMember,
      message: "Jury member added successfully",
    });
  } catch (error: any) {
    logger.error("Error creating jury member:", error);
    return res.status(500).json({
      error: error?.message || "Failed to create jury member",
    });
  }
};

export const getJuryByGroup = async (_req: Request, res: Response) => {
  try {
    const groupId = parseInt(String(_req.params.groupId), 10);

    if (!groupId || Number.isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    const jury = await prisma.pfeJury.findMany({
      where: { groupId },
      include: {
        group: {
          include: {
            sujetFinal: true,
            groupMembers: {
              include: {
                etudiant: {
                  include: { user: true },
                },
              },
            },
          },
        },
        enseignant: {
          include: { user: true },
        },
      },
    });

    return res.status(200).json({
      data: jury,
      count: jury.length,
    });
  } catch (error: any) {
    logger.error("Error fetching jury:", error);
    return res.status(500).json({
      error: error?.message || "Failed to fetch jury",
    });
  }
};

export const getAllJury = async (_req: Request, res: Response) => {
  try {
    const jury = await prisma.pfeJury.findMany({
      include: {
        group: {
          include: {
            sujetFinal: {
              include: {
                enseignant: {
                  include: { user: true },
                },
              },
            },
            groupMembers: {
              include: {
                etudiant: {
                  include: { user: true },
                },
              },
            },
          },
        },
        enseignant: {
          include: { user: true },
        },
      },
      orderBy: { group: { createdAt: "desc" } },
    });

    return res.status(200).json({
      data: jury,
      count: jury.length,
    });
  } catch (error: any) {
    logger.error("Error fetching jury members:", error);
    return res.status(500).json({
      error: error?.message || "Failed to fetch jury members",
    });
  }
};

export const updateJuryMember = async (req: Request, res: Response) => {
  try {
    const juryId = parseInt(String(req.params.juryId), 10);
    const { enseignantId, role } = req.body;

    if (!juryId || Number.isNaN(juryId)) {
      return res.status(400).json({ error: "Invalid jury member ID" });
    }

    if (role) {
      const validRoles = ["president", "examinateur", "rapporteur"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        });
      }
    }

    const juryMember = await prisma.pfeJury.update({
      where: { id: juryId },
      data: {
        ...(enseignantId !== undefined
          ? { enseignantId: parseInt(String(enseignantId)) }
          : {}),
        ...(role ? { role } : {}),
      },
      include: {
        group: true,
        enseignant: {
          include: { user: true },
        },
      },
    });

    return res.status(200).json({
      data: juryMember,
      message: "Jury member updated successfully",
    });
  } catch (error: any) {
    logger.error("Error updating jury member:", error);
    return res.status(500).json({
      error: error?.message || "Failed to update jury member",
    });
  }
};

export const deleteJuryMember = async (req: Request, res: Response) => {
  try {
    const juryId = parseInt(String(req.params.juryId), 10);

    if (!juryId || Number.isNaN(juryId)) {
      return res.status(400).json({ error: "Invalid jury member ID" });
    }

    await prisma.pfeJury.delete({
      where: { id: juryId },
    });

    return res.status(200).json({
      message: "Jury member deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting jury member:", error);
    return res.status(500).json({
      error: error?.message || "Failed to delete jury member",
    });
  }
};

export const updateDefenseEvaluation = async (req: Request, res: Response) => {
  try {
    const groupeId = parseInt(String(req.params.groupeId), 10);
    const { note, mention } = req.body;

    if (!groupeId || note === undefined) {
      return res.status(400).json({
        error: "groupeId and note are required",
      });
    }

    const groupe = await prisma.groupPfe.update({
      where: { id: groupeId },
      data: {
        note: parseFloat(String(note)),
        mention,
      },
      include: {
        sujetFinal: true,
        groupMembers: {
          include: {
            etudiant: {
              include: { user: true },
            },
          },
        },
        pfeJury: {
          include: {
            enseignant: {
              include: { user: true },
            },
          },
        },
      },
    });

    return res.status(200).json({
      data: groupe,
      message: "Defense evaluation updated successfully",
    });
  } catch (error: any) {
    logger.error("Error updating defense evaluation:", error);
    return res.status(500).json({
      error: error?.message || "Failed to update defense evaluation",
    });
  }
};
