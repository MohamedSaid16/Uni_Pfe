import { Prisma, StatusDocumentRequest } from "@prisma/client";
import prisma from "../../config/database";
import logger from "../../utils/logger";
import {
  createAlert,
  getUserAlerts,
  markAsRead,
} from "./alert.service";

export { createAlert, getUserAlerts, markAsRead } from "./alert.service";

type AlertEventClient = typeof prisma | Prisma.TransactionClient;

const normalizeText = (value: unknown): string => String(value || "").trim();

const formatDateTime = (value: Date | string | null | undefined): string => {
  if (!value) return "TBD";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toISOString().replace("T", " ").slice(0, 16);
};

const resolveDossierEventTargets = async (dossierId: number, client: AlertEventClient) => {
  const dossier = await client.dossierDisciplinaire.findUnique({
    where: { id: dossierId },
    include: {
      etudiant: { select: { userId: true } },
      enseignantSignalantR: { select: { userId: true } },
      decision: { select: { nom_ar: true, nom_en: true } },
      conseil: {
        select: {
          dateReunion: true,
          lieu: true,
          description_ar: true,
          description_en: true,
        },
      },
    },
  });

  if (!dossier) {
    throw new Error(`Disciplinary case ${dossierId} not found`);
  }

  return dossier;
};

export const createMeetingScheduledAlert = async (
  dossierId: number,
  client: AlertEventClient = prisma
) => {
  const dossier = await resolveDossierEventTargets(dossierId, client);
  const studentUserId = Number(dossier.etudiant?.userId || 0);

  if (!studentUserId) {
    logger.warn(`Meeting alert skipped: student user not found for dossier ${dossierId}`);
    return null;
  }

  const meetingDate = formatDateTime(dossier.conseil?.dateReunion || null);
  const meetingLocation = normalizeText(dossier.conseil?.lieu) || "Not specified";
  const details = normalizeText(dossier.conseil?.description_ar || dossier.conseil?.description_en) ||
    "A disciplinary meeting has been scheduled for your case.";

  return createAlert(
    studentUserId,
    "Disciplinary Meeting Scheduled",
    `Date: ${meetingDate}\nLocation: ${meetingLocation}\nDetails: ${details}`,
    "MEETING",
    client
  );
};

export const createDisciplinaryDecisionAlerts = async (
  dossierId: number,
  client: AlertEventClient = prisma
) => {
  const dossier = await resolveDossierEventTargets(dossierId, client);
  const studentUserId = Number(dossier.etudiant?.userId || 0);
  const reportingTeacherUserId = Number(dossier.enseignantSignalantR?.userId || 0);
  const decisionValue =
    normalizeText(dossier.decision?.nom_en) ||
    normalizeText(dossier.decision?.nom_ar) ||
    "sanction";
  const explanation =
    normalizeText(dossier.remarqueDecision_en) ||
    normalizeText(dossier.remarqueDecision_ar) ||
    "No explanation provided.";

  const payload = `Decision: ${decisionValue}\nExplanation: ${explanation}`;
  const created: number[] = [];

  if (studentUserId > 0) {
    const studentAlert = await createAlert(
      studentUserId,
      "Disciplinary Decision",
      payload,
      "DECISION",
      client
    );
    created.push(studentAlert.id);
  }

  if (reportingTeacherUserId > 0) {
    const teacherAlert = await createAlert(
      reportingTeacherUserId,
      "Disciplinary Decision",
      payload,
      "DECISION",
      client
    );
    created.push(teacherAlert.id);
  }

  return created;
};

const DOCUMENT_STATUS_LABEL: Record<StatusDocumentRequest, string> = {
  en_attente: "pending",
  en_traitement: "pending",
  valide: "approved",
  refuse: "rejected",
};

export const createDocumentRequestStatusAlert = async (
  documentRequestId: number,
  options: { optionalMessage?: string } = {},
  client: AlertEventClient = prisma
) => {
  const request = await client.documentRequest.findUnique({
    where: { id: documentRequestId },
    include: {
      enseignant: {
        select: {
          userId: true,
        },
      },
      typeDoc: {
        select: {
          nom_ar: true,
          nom_en: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error(`Document request ${documentRequestId} not found`);
  }

  if (![StatusDocumentRequest.valide, StatusDocumentRequest.refuse].includes(request.status)) {
    return null;
  }

  const teacherUserId = Number(request.enseignant?.userId || 0);
  if (!teacherUserId) {
    logger.warn(`Document request alert skipped: teacher user not found for request ${documentRequestId}`);
    return null;
  }

  const typeLabel =
    normalizeText(request.typeDoc?.nom_en) ||
    normalizeText(request.typeDoc?.nom_ar) ||
    `Request #${request.id}`;
  const statusLabel = DOCUMENT_STATUS_LABEL[request.status] || String(request.status);
  const optional = normalizeText(options.optionalMessage);
  const message = [
    `Status: ${statusLabel}`,
    `Request: ${typeLabel}`,
    optional ? `Message: ${optional}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return createAlert(
    teacherUserId,
    "Document Request Update",
    message,
    "REQUEST",
    client
  );
};
