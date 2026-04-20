import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import * as sujetCtrl from "./sujet.controller";
import * as groupeCtrl from "./groupe.controller";
import * as juryCtrl from "./jury.controller";

const router = Router();

// ─── SUJET ROUTES ───────────────────────────────────────
// /api/pfe/sujets

// Get all subjects (with optional filters)
router.get(
  "/sujets",
  requireAuth,
  requireRole(["admin", "enseignant", "etudiant"]),
  sujetCtrl.getAllSujets
);

// Create new subject (teachers only)
router.post(
  "/sujets",
  requireAuth,
  requireRole(["enseignant"]),
  sujetCtrl.createSujet
);

// Get subject by ID
router.get(
  "/sujets/:sujetId",
  requireAuth,
  requireRole(["admin", "enseignant", "etudiant"]),
  sujetCtrl.getSujetById
);

// Update subject (own subject or admin)
router.put(
  "/sujets/:sujetId",
  requireAuth,
  requireRole(["enseignant", "admin"]),
  sujetCtrl.updateSujet
);

// Delete subject (own subject or admin)
router.delete(
  "/sujets/:sujetId",
  requireAuth,
  requireRole(["enseignant", "admin"]),
  sujetCtrl.deleteSujet
);

// Validate subject (admin only)
router.patch(
  "/sujets/:sujetId/validate",
  requireAuth,
  requireRole(["admin"]),
  sujetCtrl.validateSujet
);

// Reject subject (admin only)
router.patch(
  "/sujets/:sujetId/reject",
  requireAuth,
  requireRole(["admin"]),
  sujetCtrl.rejectSujet
);

// ─── GROUP ROUTES ───────────────────────────────────────
// /api/pfe/groupes

// Get all groups
router.get(
  "/groupes",
  requireAuth,
  requireRole(["admin", "enseignant", "etudiant"]),
  groupeCtrl.getAllGroupes
);

// Create new group (admin only)
router.post(
  "/groupes",
  requireAuth,
  requireRole(["admin"]),
  groupeCtrl.createGroupe
);

// Get group by ID
router.get(
  "/groupes/:groupeId",
  requireAuth,
  requireRole(["admin", "enseignant", "etudiant"]),
  groupeCtrl.getGroupeById
);

// Update group (admin only)
router.put(
  "/groupes/:groupeId",
  requireAuth,
  requireRole(["admin"]),
  groupeCtrl.updateGroupe
);

// Delete group (admin only)
router.delete(
  "/groupes/:groupeId",
  requireAuth,
  requireRole(["admin"]),
  groupeCtrl.deleteGroupe
);

// Add member to group
router.post(
  "/groupes/:groupeId/members",
  requireAuth,
  requireRole(["admin", "etudiant"]),
  groupeCtrl.addGroupMember
);

// Remove member from group
router.delete(
  "/groupes/members/:memberId",
  requireAuth,
  requireRole(["admin", "etudiant"]),
  groupeCtrl.removeGroupMember
);

// Assign subject to group
router.patch(
  "/groupes/:groupeId/assign-subject",
  requireAuth,
  requireRole(["admin", "etudiant"]),
  groupeCtrl.assignSubjectToGroup
);

// Schedule defense
router.patch(
  "/groupes/:groupeId/schedule-defense",
  requireAuth,
  requireRole(["admin"]),
  groupeCtrl.scheduleDefense
);

// ─── JURY ROUTES ────────────────────────────────────────
// /api/pfe/jury

// Get all jury members
router.get(
  "/jury",
  requireAuth,
  requireRole(["admin", "enseignant"]),
  juryCtrl.getAllJury
);

// Get jury for specific group
router.get(
  "/jury/group/:groupId",
  requireAuth,
  requireRole(["admin", "enseignant", "etudiant"]),
  juryCtrl.getJuryByGroup
);

// Add jury member to group
router.post(
  "/jury",
  requireAuth,
  requireRole(["admin"]),
  juryCtrl.createJuryMember
);

// Update jury member
router.put(
  "/jury/:juryId",
  requireAuth,
  requireRole(["admin"]),
  juryCtrl.updateJuryMember
);

// Delete jury member
router.delete(
  "/jury/:juryId",
  requireAuth,
  requireRole(["admin"]),
  juryCtrl.deleteJuryMember
);

// Update defense evaluation (grade & mention)
router.patch(
  "/groupes/:groupeId/evaluation",
  requireAuth,
  requireRole(["admin", "enseignant"]),
  juryCtrl.updateDefenseEvaluation
);

export default router;
