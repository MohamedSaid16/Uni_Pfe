/**
 * Groupe Service - Admin Group Management with Transactions
 * 
 * Provides transactional group creation with members and admin-specific operations
 * All operations use Prisma transactions to ensure atomicity and data consistency
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Validates input data for admin group creation
 * @param {Object} payload - Request body
 * @returns {Object} Validated payload
 * @throws {Error} If validation fails
 */
function validateAdminGroupPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Request body is required');
  }

  const nom_ar = typeof payload.nom_ar === 'string' ? payload.nom_ar.trim() : '';
  const nom_en = typeof payload.nom_en === 'string' ? payload.nom_en.trim() : null;
  
  if (!nom_ar) {
    throw new Error('nom_ar (group name in Arabic) is required');
  }

  const sujetFinalId = Number.parseInt(payload.sujetFinalId, 10);
  const coEncadrantId = Number.parseInt(payload.coEncadrantId, 10);
  
  if (!Number.isInteger(sujetFinalId) || sujetFinalId <= 0) {
    throw new Error('sujetFinalId must be a positive integer');
  }
  
  if (!Number.isInteger(coEncadrantId) || coEncadrantId <= 0) {
    throw new Error('coEncadrantId must be a positive integer');
  }

  // Members validation
  if (!Array.isArray(payload.members) || payload.members.length === 0) {
    throw new Error('members must be a non-empty array with at least 1 student');
  }

  if (payload.members.length > 3) {
    throw new Error('A group cannot have more than 3 members');
  }

  const seen = new Set();
  const members = payload.members.map((m, i) => {
    const etudiantId = Number.parseInt(m?.etudiantId, 10);
    
    if (!Number.isInteger(etudiantId) || etudiantId <= 0) {
      throw new Error(`members[${i}].etudiantId must be a positive integer`);
    }
    
    if (seen.has(etudiantId)) {
      throw new Error(`Duplicate etudiantId ${etudiantId} in members array`);
    }
    
    seen.add(etudiantId);

    const role = m?.role || 'membre';
    if (role !== 'membre' && role !== 'chef_groupe') {
      throw new Error(`members[${i}].role must be "membre" or "chef_groupe"`);
    }

    return { etudiantId, role };
  });

  return {
    nom_ar,
    nom_en: nom_en || null,
    sujetFinalId,
    coEncadrantId,
    members,
  };
}

/**
 * Creates a group with members in a single atomic transaction
 * Ensures that if any operation fails, the entire transaction is rolled back
 * 
 * @param {Object} payload - Validated payload with nom_ar, nom_en, sujetFinalId, coEncadrantId, members
 * @returns {Promise<Object>} Created group with all relations
 * @throws {Error} If any validation fails or transaction fails
 */
async function createGroupWithMembers(payload) {
  const validatedPayload = validateAdminGroupPayload(payload);
  const etudiantIds = validatedPayload.members.map((m) => m.etudiantId);

  // Use Prisma transaction for atomicity
  return prisma.$transaction(async (tx) => {
    // 1. Verify subject exists and is validated
    const sujet = await tx.pfeSujet.findUnique({
      where: { id: validatedPayload.sujetFinalId },
      select: {
        id: true,
        titre_ar: true,
        titre_en: true,
        status: true,
        promoId: true,
        maxGrps: true,
        anneeUniversitaire: true,
        groupsPfe: { select: { id: true } },
      },
    });

    if (!sujet) {
      throw new Error(`Subject with ID ${validatedPayload.sujetFinalId} not found`);
    }

    if (sujet.status !== 'valide') {
      throw new Error(`Subject must have status "valide" (current: ${sujet.status})`);
    }

    // 2. Check subject capacity
    if (sujet.groupsPfe.length >= sujet.maxGrps) {
      throw new Error(`Subject has reached its maximum capacity of ${sujet.maxGrps} groups`);
    }

    // 3. Verify co-encadrant exists
    const coEncadrant = await tx.enseignant.findUnique({
      where: { id: validatedPayload.coEncadrantId },
      select: { id: true, user: { select: { prenom: true, nom: true } } },
    });

    if (!coEncadrant) {
      throw new Error(`Co-encadrant with ID ${validatedPayload.coEncadrantId} not found`);
    }

    // 4. Verify all students exist
    const etudiants = await tx.etudiant.findMany({
      where: { id: { in: etudiantIds } },
      select: { id: true, promoId: true, user: { select: { prenom: true, nom: true } } },
    });

    if (etudiants.length !== etudiantIds.length) {
      const found = new Set(etudiants.map((e) => e.id));
      const missing = etudiantIds.filter((id) => !found.has(id));
      throw new Error(`Students not found: ${missing.join(', ')}`);
    }

    // 5. Verify all students belong to the subject's promo
    const wrongPromo = etudiants.filter((e) => e.promoId !== sujet.promoId);
    if (wrongPromo.length > 0) {
      const ids = wrongPromo.map((e) => e.id).join(', ');
      throw new Error(
        `Students ${ids} do not belong to the subject's promotion (required: ${sujet.promoId})`
      );
    }

    // 6. Verify no student is already in another group for this academic year
    const conflicts = await tx.groupMember.findMany({
      where: {
        etudiantId: { in: etudiantIds },
        group: {
          sujetFinal: {
            anneeUniversitaire: sujet.anneeUniversitaire,
          },
        },
      },
      select: { etudiantId: true, group: { select: { nom_ar: true } } },
    });

    if (conflicts.length > 0) {
      const ids = [...new Set(conflicts.map((c) => c.etudiantId))].join(', ');
      throw new Error(
        `Students ${ids} are already assigned to a group for academic year ${sujet.anneeUniversitaire}`
      );
    }

    // 7. Create group (atomic operation within transaction)
    const now = new Date();
    const createdGroup = await tx.groupPfe.create({
      data: {
        nom_ar: validatedPayload.nom_ar,
        nom_en: validatedPayload.nom_en,
        sujetFinalId: sujet.id,
        coEncadrantId: coEncadrant.id,
        dateCreation: now,
        dateAffectation: now,
      },
      select: { id: true },
    });

    // 8. Add all members to group (within same transaction)
    const createdMembers = await tx.groupMember.createMany({
      data: validatedPayload.members.map((m) => ({
        groupId: createdGroup.id,
        etudiantId: m.etudiantId,
        role: m.role,
      })),
    });

    // 9. Fetch and return complete group with all relations
    return tx.groupPfe.findUnique({
      where: { id: createdGroup.id },
      include: {
        sujetFinal: {
          select: {
            id: true,
            titre_ar: true,
            titre_en: true,
            status: true,
          },
        },
        coEncadrant: {
          include: {
            user: { select: { prenom: true, nom: true } },
          },
        },
        groupMembers: {
          include: {
            etudiant: {
              include: {
                user: { select: { prenom: true, nom: true } },
              },
            },
          },
        },
      },
    });
  });
}

/**
 * Assigns a subject to an existing group (admin-only direct assignment)
 * Bypasses the student bidding system
 * 
 * @param {number} groupId - Group ID
 * @param {number} sujetId - Subject ID
 * @returns {Promise<Object>} Updated group
 * @throws {Error} If validation fails
 */
async function assignSubjectToGroup(groupId, sujetId) {
  return prisma.$transaction(async (tx) => {
    // 1. Verify group exists
    const group = await tx.groupPfe.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        nom_ar: true,
        sujetFinalId: true,
        groupMembers: { select: { etudiantId: true } },
      },
    });

    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`);
    }

    // 2. Verify subject exists and is validated
    const sujet = await tx.pfeSujet.findUnique({
      where: { id: sujetId },
      select: {
        id: true,
        titre_ar: true,
        status: true,
        promoId: true,
        maxGrps: true,
        groupsPfe: { select: { id: true } },
      },
    });

    if (!sujet) {
      throw new Error(`Subject with ID ${sujetId} not found`);
    }

    if (sujet.status !== 'valide') {
      throw new Error(`Subject must have status "valide" (current: ${sujet.status})`);
    }

    // 3. Check subject capacity (excluding current group)
    const usedSlots = sujet.groupsPfe.filter((g) => g.id !== groupId).length;
    if (usedSlots >= sujet.maxGrps) {
      throw new Error(`Subject has reached its maximum capacity of ${sujet.maxGrps} groups`);
    }

    // 4. Verify all group members belong to subject's promo
    const groupStudents = await tx.etudiant.findMany({
      where: { id: { in: group.groupMembers.map((m) => m.etudiantId) } },
      select: { id: true, promoId: true },
    });

    const wrongPromo = groupStudents.filter((e) => e.promoId !== sujet.promoId);
    if (wrongPromo.length > 0) {
      throw new Error(
        `Group members do not belong to the subject's promotion (required: ${sujet.promoId})`
      );
    }

    // 5. Update group with new subject
    return tx.groupPfe.update({
      where: { id: groupId },
      data: {
        sujetFinalId: sujetId,
        dateAffectation: new Date(),
      },
      include: {
        sujetFinal: {
          select: {
            id: true,
            titre_ar: true,
            titre_en: true,
          },
        },
        coEncadrant: {
          include: { user: { select: { prenom: true, nom: true } } },
        },
        groupMembers: {
          include: {
            etudiant: {
              include: { user: { select: { prenom: true, nom: true } } },
            },
          },
        },
      },
    });
  });
}

module.exports = {
  createGroupWithMembers,
  assignSubjectToGroup,
  validateAdminGroupPayload,
};
