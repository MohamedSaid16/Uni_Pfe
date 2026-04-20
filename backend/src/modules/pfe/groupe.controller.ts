import { Request, Response } from "express";
import prisma from "../../config/database";
import logger from "../../utils/logger";

/**
 * GROUPE CONTROLLER
 * Handles PFE group (Groupe) management
 * Fields: nom_ar, nom_en, sujetFinalId, coEncadrantId, groupMembers, etc.
 */

export const createGroupe = async (req: Request, res: Response) => {
  try {
    const {
      nom_ar,
      nom_en,
      sujetFinalId,
      coEncadrantId,
      dateCreation,
      dateAffectation,
      dateSoutenance,
      salleSoutenance,
      note,
      mention,
    } = req.body;

    if (!nom_ar || !sujetFinalId || !coEncadrantId) {
      return res.status(400).json({
        error: "Missing required fields: nom_ar, sujetFinalId, coEncadrantId",
      });
    }

    const groupe = await prisma.groupPfe.create({
      data: {
        nom_ar,
        nom_en,
        sujetFinalId: parseInt(String(sujetFinalId)),
        coEncadrantId: parseInt(String(coEncadrantId)),
        dateCreation: dateCreation ? new Date(dateCreation) : null,
        dateAffectation: dateAffectation ? new Date(dateAffectation) : null,
        dateSoutenance: dateSoutenance ? new Date(dateSoutenance) : null,
        salleSoutenance,
        note: note ? parseFloat(String(note)) : null,
        mention,
      },
      include: {
        sujetFinal: {
          include: {
            enseignant: {
              include: { user: true },
            },
            promo: true,
          },
        },
        coEncadrant: {
          include: { user: true },
        },
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

    return res.status(201).json({
      data: groupe,
      message: "Group created successfully",
    });
  } catch (error: any) {
    logger.error("Error creating group:", error);
    return res.status(500).json({
      error: error?.message || "Failed to create group",
    });
  }
};

export const getAllGroupes = async (req: Request, res: Response) => {
  try {
    const sujetFinalId = req.query.sujetFinalId
      ? parseInt(String(req.query.sujetFinalId), 10)
      : undefined;

    const userRoles = (req as any).user?.roles || [];
    const userId = (req as any).user?.id;
    const isAdmin = userRoles.includes("admin");
    const isTeacher = userRoles.includes("enseignant");
    const isStudent = userRoles.includes("etudiant");

    const whereClause: any = {
      ...(sujetFinalId && !Number.isNaN(sujetFinalId)
        ? { sujetFinalId }
        : {}),
    };

    if (!isAdmin && isTeacher) {
      const enseignant = await prisma.enseignant.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!enseignant) {
        return res.status(200).json({
          data: [],
          count: 0,
        });
      }

      whereClause.OR = [
        {
          sujetFinal: {
            enseignantId: enseignant.id,
          },
        },
        {
          groupSujets: {
            some: {
              sujet: {
                enseignantId: enseignant.id,
              },
            },
          },
        },
      ];
    }

    if (!isAdmin && !isTeacher && isStudent) {
      whereClause.groupMembers = {
        some: {
          etudiant: {
            userId,
          },
        },
      };
    }

    const groupes = await prisma.groupPfe.findMany({
      where: whereClause,
      include: {
        sujetFinal: {
          include: {
            enseignant: {
              include: { user: true },
            },
            promo: true,
          },
        },
        coEncadrant: {
          include: { user: true },
        },
        groupMembers: {
          include: {
            etudiant: {
              include: { user: true },
            },
          },
        },
        groupSujets: {
          include: {
            sujet: true,
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
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      data: groupes,
      count: groupes.length,
    });
  } catch (error: any) {
    logger.error("Error fetching groups:", error);
    return res.status(500).json({
      error: error?.message || "Failed to fetch groups",
    });
  }
};

export const getGroupeById = async (req: Request, res: Response) => {
  try {
    const groupeId = parseInt(String(req.params.groupeId), 10);

    if (!groupeId || Number.isNaN(groupeId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    const groupe = await prisma.groupPfe.findUnique({
      where: { id: groupeId },
      include: {
        sujetFinal: {
          include: {
            enseignant: {
              include: { user: true },
            },
            promo: true,
          },
        },
        coEncadrant: {
          include: { user: true },
        },
        groupMembers: {
          include: {
            etudiant: {
              include: { user: true },
            },
          },
        },
        groupSujets: {
          include: {
            sujet: true,
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

    if (!groupe) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.status(200).json({ data: groupe });
  } catch (error: any) {
    logger.error("Error fetching group:", error);
    return res.status(500).json({
      error: error?.message || "Failed to fetch group",
    });
  }
};

export const updateGroupe = async (req: Request, res: Response) => {
  try {
    const groupeId = parseInt(String(req.params.groupeId), 10);
    const {
      nom_ar,
      nom_en,
      dateAffectation,
      dateSoutenance,
      salleSoutenance,
      note,
      mention,
    } = req.body;

    if (!groupeId || Number.isNaN(groupeId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    const groupe = await prisma.groupPfe.update({
      where: { id: groupeId },
      data: {
        ...(nom_ar ? { nom_ar } : {}),
        ...(nom_en !== undefined ? { nom_en } : {}),
        ...(dateAffectation !== undefined
          ? { dateAffectation: dateAffectation ? new Date(dateAffectation) : null }
          : {}),
        ...(dateSoutenance !== undefined
          ? { dateSoutenance: dateSoutenance ? new Date(dateSoutenance) : null }
          : {}),
        ...(salleSoutenance !== undefined ? { salleSoutenance } : {}),
        ...(note !== undefined ? { note: note ? parseFloat(String(note)) : null } : {}),
        ...(mention !== undefined ? { mention } : {}),
      },
      include: {
        sujetFinal: {
          include: {
            enseignant: {
              include: { user: true },
            },
            promo: true,
          },
        },
        coEncadrant: {
          include: { user: true },
        },
        groupMembers: {
          include: {
            etudiant: {
              include: { user: true },
            },
          },
        },
      },
    });

    return res.status(200).json({
      data: groupe,
      message: "Group updated successfully",
    });
  } catch (error: any) {
    logger.error("Error updating group:", error);
    return res.status(500).json({
      error: error?.message || "Failed to update group",
    });
  }
};

export const deleteGroupe = async (req: Request, res: Response) => {
  try {
    const groupeId = parseInt(String(req.params.groupeId), 10);

    if (!groupeId || Number.isNaN(groupeId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    await prisma.groupPfe.delete({
      where: { id: groupeId },
    });

    return res.status(200).json({
      message: "Group deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting group:", error);
    return res.status(500).json({
      error: error?.message || "Failed to delete group",
    });
  }
};

export const addGroupMember = async (req: Request, res: Response) => {
  try {
    const groupeId = parseInt(String(req.params.groupeId), 10);
    const { etudiantId, role = "membre" } = req.body;

    if (!groupeId || !etudiantId) {
      return res.status(400).json({
        error: "groupeId and etudiantId are required",
      });
    }

    // RULE: Max 3 members per group
    const membersCount = await prisma.groupMember.count({
      where: { groupId: groupeId },
    });

    if (membersCount >= 3) {
      return res.status(400).json({
        error: "A group cannot have more than 3 members",
      });
    }

    // Check if student is already in a group
    const existingMembership = await prisma.groupMember.findFirst({
      where: { etudiantId: parseInt(String(etudiantId)) },
    });

    if (existingMembership) {
      return res.status(400).json({
        error: "This student is already in a group",
      });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId: groupeId,
        etudiantId: parseInt(String(etudiantId)),
        role,
      },
      include: {
        etudiant: {
          include: { user: true },
        },
        group: true,
      },
    });

    return res.status(201).json({
      data: member,
      message: "Member added to group successfully",
    });
  } catch (error: any) {
    logger.error("Error adding group member:", error);
    return res.status(500).json({
      error: error?.message || "Failed to add group member",
    });
  }
};

export const removeGroupMember = async (req: Request, res: Response) => {
  try {
    const memberId = parseInt(String(req.params.memberId), 10);

    if (!memberId || Number.isNaN(memberId)) {
      return res.status(400).json({ error: "Invalid member ID" });
    }

    await prisma.groupMember.delete({
      where: { id: memberId },
    });

    return res.status(200).json({
      message: "Member removed from group successfully",
    });
  } catch (error: any) {
    logger.error("Error removing group member:", error);
    return res.status(500).json({
      error: error?.message || "Failed to remove group member",
    });
  }
};

export const assignSubjectToGroup = async (req: Request, res: Response) => {
  try {
    const groupeId = parseInt(String(req.params.groupeId), 10);
    const { sujetId } = req.body;

    if (!groupeId || !sujetId) {
      return res.status(400).json({
        error: "groupeId and sujetId are required",
      });
    }

    const groupe = await prisma.groupPfe.update({
      where: { id: groupeId },
      data: {
        sujetFinalId: parseInt(String(sujetId)),
        dateAffectation: new Date(),
      },
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
    });

    return res.status(200).json({
      data: groupe,
      message: "Subject assigned to group successfully",
    });
  } catch (error: any) {
    logger.error("Error assigning subject to group:", error);
    return res.status(500).json({
      error: error?.message || "Failed to assign subject to group",
    });
  }
};

export const scheduleDefense = async (req: Request, res: Response) => {
  try {
    const groupeId = parseInt(String(req.params.groupeId), 10);
    const { dateSoutenance, salleSoutenance } = req.body;

    if (!groupeId || !dateSoutenance || !salleSoutenance) {
      return res.status(400).json({
        error: "groupeId, dateSoutenance, and salleSoutenance are required",
      });
    }

    const groupe = await prisma.groupPfe.update({
      where: { id: groupeId },
      data: {
        dateSoutenance: new Date(dateSoutenance),
        salleSoutenance,
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
      message: "Defense scheduled successfully",
    });
  } catch (error: any) {
    logger.error("Error scheduling defense:", error);
    return res.status(500).json({
      error: error?.message || "Failed to schedule defense",
    });
  }
};
