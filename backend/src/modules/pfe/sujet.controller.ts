import { Request, Response } from "express";
import prisma from "../../config/database";
import logger from "../../utils/logger";

/**
 * SUJET CONTROLLER
 * Handles PFE subject (Sujet) management
 * Fields: titre_ar, titre_en, description_ar, description_en, etc.
 */

export const createSujet = async (req: Request, res: Response) => {
  try {
    const {
      titre_ar,
      titre_en,
      description_ar,
      description_en,
      keywords_ar,
      keywords_en,
      promoId,
      workplan_ar,
      workplan_en,
      bibliographie_ar,
      bibliographie_en,
      typeProjet = "application",
      anneeUniversitaire,
      maxGrps = 1,
    } = req.body;

    // Get current teacher's ID from auth context
    const currentUserId = (req as any).user?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Fetch the Enseignant record for this teacher
    const enseignant = await prisma.enseignant.findUnique({
      where: { userId: currentUserId },
    });

    if (!enseignant) {
      return res.status(403).json({
        error: "Teacher profile not found. Please contact administration.",
      });
    }

    // Validation
    if (!titre_ar || !promoId || !anneeUniversitaire) {
      return res.status(400).json({
        error: "Missing required fields: titre_ar, promoId, anneeUniversitaire",
      });
    }

    // RULE: Max 3 subjects per teacher per academic year
    const sujetCount = await prisma.pfeSujet.count({
      where: {
        enseignantId: enseignant.id,
        anneeUniversitaire,
      },
    });

    if (sujetCount >= 3) {
      return res.status(400).json({
        error: "A teacher cannot propose more than 3 subjects per academic year",
      });
    }

    const sujet = await prisma.pfeSujet.create({
      data: {
        titre_ar,
        titre_en,
        description_ar,
        description_en,
        keywords_ar,
        keywords_en,
        enseignantId: enseignant.id,
        promoId: parseInt(String(promoId)),
        workplan_ar,
        workplan_en,
        bibliographie_ar,
        bibliographie_en,
        typeProjet,
        status: "propose",
        anneeUniversitaire,
        maxGrps: parseInt(String(maxGrps)),
      },
      include: {
        enseignant: {
          include: { user: true },
        },
        promo: true,
      },
    });

    return res.status(201).json({
      data: sujet,
      message: "Subject created successfully",
    });
  } catch (error: any) {
    logger.error("Error creating subject:", error);
    return res.status(500).json({
      error: error?.message || "Failed to create subject",
    });
  }
};

export const getAllSujets = async (req: Request, res: Response) => {
  try {
    const promoId = req.query.promoId
      ? parseInt(String(req.query.promoId), 10)
      : undefined;
    const enseignantId = req.query.enseignantId
      ? parseInt(String(req.query.enseignantId), 10)
      : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const anneeUniversitaire = req.query.anneeUniversitaire
      ? String(req.query.anneeUniversitaire)
      : undefined;

    // Role-based data filtering
    const userRoles = (req as any).user?.roles || [];  // Array of role names
    const userId = (req as any).user?.id;

    // Students can only see validated subjects
    const isStudent = userRoles.includes("etudiant");
    // Teachers can see their own + validated subjects (for reference)
    const isTeacher = userRoles.includes("enseignant");
    // Admins see all
    const isAdmin = userRoles.includes("admin");

    // Get teacher's Enseignant ID if they are a teacher
    let teacherEnseignantId: number | null = null;
    if (isTeacher && !isAdmin) {
      const enseignant = await prisma.enseignant.findUnique({
        where: { userId },
      });
      teacherEnseignantId = enseignant?.id || null;
    }

    const whereClause: any = {
      ...(promoId && !Number.isNaN(promoId) ? { promoId } : {}),
      ...(enseignantId && !Number.isNaN(enseignantId)
        ? { enseignantId }
        : {}),
      ...(status ? { status: status as any } : {}),
      ...(anneeUniversitaire ? { anneeUniversitaire } : {}),
    };

    // Apply role-based filters
    if (isStudent) {
      // Students only see validated subjects
      whereClause.status = "valide";
    } else if (isTeacher && !enseignantId && !isAdmin) {
      // Teachers see their own subjects OR validated subjects
      whereClause.OR = [
        { enseignantId: teacherEnseignantId },
        { status: "valide" },
      ];
    }

    const sujets = await prisma.pfeSujet.findMany({
      where: whereClause,
      include: {
        enseignant: {
          include: { user: true },
        },
        promo: true,
        groupsPfe: true,
        groupSujets: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      data: sujets,
      count: sujets.length,
      userRoles,
    });
  } catch (error: any) {
    logger.error("Error fetching subjects:", error);
    return res.status(500).json({
      error: error?.message || "Failed to fetch subjects",
    });
  }
};

export const getSujetById = async (req: Request, res: Response) => {
  try {
    const sujetId = parseInt(String(req.params.sujetId), 10);

    if (!sujetId || Number.isNaN(sujetId)) {
      return res.status(400).json({ error: "Invalid subject ID" });
    }

    const sujet = await prisma.pfeSujet.findUnique({
      where: { id: sujetId },
      include: {
        enseignant: {
          include: { user: true },
        },
        promo: true,
        groupsPfe: {
          include: {
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
        },
        groupSujets: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!sujet) {
      return res.status(404).json({ error: "Subject not found" });
    }

    return res.status(200).json({ data: sujet });
  } catch (error: any) {
    logger.error("Error fetching subject:", error);
    return res.status(500).json({
      error: error?.message || "Failed to fetch subject",
    });
  }
};

export const updateSujet = async (req: Request, res: Response) => {
  try {
    const sujetId = parseInt(String(req.params.sujetId), 10);
    const {
      titre_ar,
      titre_en,
      description_ar,
      description_en,
      keywords_ar,
      keywords_en,
      workplan_ar,
      workplan_en,
      bibliographie_ar,
      bibliographie_en,
      typeProjet,
      status,
      maxGrps,
    } = req.body;

    if (!sujetId || Number.isNaN(sujetId)) {
      return res.status(400).json({ error: "Invalid subject ID" });
    }

    // Check ownership (teachers can only edit their own, admins can edit all)
    const existingSubjet = await prisma.pfeSujet.findUnique({
      where: { id: sujetId },
    });

    if (!existingSubjet) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const userRoles = (req as any).user?.roles || [];
    const userId = (req as any).user?.id;
    const isAdmin = userRoles.includes("admin");

    // Get teacher's Enseignant ID
    let teacherEnseignantId: number | null = null;
    if (!isAdmin) {
      const enseignant = await prisma.enseignant.findUnique({
        where: { userId },
      });
      teacherEnseignantId = enseignant?.id || null;
    }

    const isOwner = existingSubjet.enseignantId === teacherEnseignantId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        error: "You can only edit your own subjects",
      });
    }

    const sujet = await prisma.pfeSujet.update({
      where: { id: sujetId },
      data: {
        ...(titre_ar ? { titre_ar } : {}),
        ...(titre_en !== undefined ? { titre_en } : {}),
        ...(description_ar ? { description_ar } : {}),
        ...(description_en !== undefined ? { description_en } : {}),
        ...(keywords_ar !== undefined ? { keywords_ar } : {}),
        ...(keywords_en !== undefined ? { keywords_en } : {}),
        ...(workplan_ar !== undefined ? { workplan_ar } : {}),
        ...(workplan_en !== undefined ? { workplan_en } : {}),
        ...(bibliographie_ar !== undefined ? { bibliographie_ar } : {}),
        ...(bibliographie_en !== undefined ? { bibliographie_en } : {}),
        ...(typeProjet ? { typeProjet } : {}),
        ...(status && isAdmin ? { status } : {}), // Only admins can change status
        ...(maxGrps !== undefined
          ? { maxGrps: parseInt(String(maxGrps)) }
          : {}),
      },
      include: {
        enseignant: {
          include: { user: true },
        },
        promo: true,
      },
    });

    return res.status(200).json({
      data: sujet,
      message: "Subject updated successfully",
    });
  } catch (error: any) {
    logger.error("Error updating subject:", error);
    return res.status(500).json({
      error: error?.message || "Failed to update subject",
    });
  }
};

export const deleteSujet = async (req: Request, res: Response) => {
  try {
    const sujetId = parseInt(String(req.params.sujetId), 10);

    if (!sujetId || Number.isNaN(sujetId)) {
      return res.status(400).json({ error: "Invalid subject ID" });
    }

    // Check ownership
    const existingSubjet = await prisma.pfeSujet.findUnique({
      where: { id: sujetId },
    });

    if (!existingSubjet) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const userRoles = (req as any).user?.roles || [];
    const userId = (req as any).user?.id;
    const isAdmin = userRoles.includes("admin");

    // Get teacher's Enseignant ID
    let teacherEnseignantId: number | null = null;
    if (!isAdmin) {
      const enseignant = await prisma.enseignant.findUnique({
        where: { userId },
      });
      teacherEnseignantId = enseignant?.id || null;
    }

    const isOwner = existingSubjet.enseignantId === teacherEnseignantId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        error: "You can only delete your own subjects",
      });
    }

    // Prevent deletion if subject is already validated or assigned
    if (existingSubjet.status !== "propose") {
      return res.status(400).json({
        error: "Cannot delete a subject that has been validated or assigned",
      });
    }

    await prisma.pfeSujet.delete({
      where: { id: sujetId },
    });

    return res.status(200).json({
      message: "Subject deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting subject:", error);
    return res.status(500).json({
      error: error?.message || "Failed to delete subject",
    });
  }
};

export const validateSujet = async (req: Request, res: Response) => {
  try {
    const sujetId = parseInt(String(req.params.sujetId), 10);
    const { adminId } = req.body;

    if (!sujetId || Number.isNaN(sujetId)) {
      return res.status(400).json({ error: "Invalid subject ID" });
    }

    if (!adminId) {
      return res.status(400).json({ error: "adminId is required" });
    }

    const sujet = await prisma.pfeSujet.update({
      where: { id: sujetId },
      data: {
        status: "valide",
      },
      include: {
        enseignant: {
          include: { user: true },
        },
        promo: true,
      },
    });

    return res.status(200).json({
      data: sujet,
      message: "Subject validated successfully",
    });
  } catch (error: any) {
    logger.error("Error validating subject:", error);
    return res.status(500).json({
      error: error?.message || "Failed to validate subject",
    });
  }
};

export const rejectSujet = async (req: Request, res: Response) => {
  try {
    const sujetId = parseInt(String(req.params.sujetId), 10);

    if (!sujetId || Number.isNaN(sujetId)) {
      return res.status(400).json({ error: "Invalid subject ID" });
    }

    const sujet = await prisma.pfeSujet.update({
      where: { id: sujetId },
      data: {
        status: "termine",
      },
      include: {
        enseignant: {
          include: { user: true },
        },
        promo: true,
      },
    });

    return res.status(200).json({
      data: sujet,
      message: "Subject rejected",
    });
  } catch (error: any) {
    logger.error("Error rejecting subject:", error);
    return res.status(500).json({
      error: error?.message || "Failed to reject subject",
    });
  }
};
