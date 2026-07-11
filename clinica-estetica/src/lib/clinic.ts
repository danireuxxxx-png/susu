import { db } from "@/lib/db";

const PERIOD_DAYS = 30;
const MS_DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number) {
  return new Date(Date.now() - n * MS_DAY);
}

function pctDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export async function getKpis() {
  const periodStart = daysAgo(PERIOD_DAYS);
  const prevStart = daysAgo(PERIOD_DAYS * 2);

  const [current, previous] = await Promise.all([
    db.consultation.findMany({
      where: { occurredAt: { gte: periodStart } },
      select: { valueClosed: true },
    }),
    db.consultation.findMany({
      where: { occurredAt: { gte: prevStart, lt: periodStart } },
      select: { valueClosed: true },
    }),
  ]);

  const sum = (rows: { valueClosed: number | null }[]) =>
    rows.reduce((acc, r) => acc + (r.valueClosed ?? 0), 0);
  const closed = (rows: { valueClosed: number | null }[]) =>
    rows.filter((r) => r.valueClosed !== null);

  const curRevenue = sum(current);
  const prevRevenue = sum(previous);
  const curClosed = closed(current);
  const prevClosed = closed(previous);
  const curTicket = curClosed.length ? curRevenue / curClosed.length : 0;
  const prevTicket = prevClosed.length ? prevRevenue / prevClosed.length : 0;
  const curConv = current.length ? (curClosed.length / current.length) * 100 : 0;
  const prevConv = previous.length ? (prevClosed.length / previous.length) * 100 : 0;

  return {
    revenue: curRevenue,
    revenueDelta: pctDelta(curRevenue, prevRevenue),
    ticket: curTicket,
    ticketDelta: pctDelta(curTicket, prevTicket),
    count: current.length,
    countDelta: pctDelta(current.length, previous.length),
    conversion: curConv,
    conversionDelta: curConv - prevConv,
  };
}

export async function getDailyRevenue() {
  const periodStart = daysAgo(PERIOD_DAYS - 1);
  const rows = await db.consultation.findMany({
    where: { occurredAt: { gte: periodStart } },
    select: { occurredAt: true, valueClosed: true },
  });

  const byDay = new Map<string, number>();
  for (let i = 0; i < PERIOD_DAYS; i++) {
    const d = daysAgo(PERIOD_DAYS - 1 - i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const key = r.occurredAt.toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + (r.valueClosed ?? 0));
  }

  return Array.from(byDay.entries()).map(([date, value]) => ({ date, value }));
}

export async function getTopTreatments() {
  const periodStart = daysAgo(PERIOD_DAYS);
  const rows = await db.consultation.groupBy({
    by: ["treatmentName"],
    where: { occurredAt: { gte: periodStart }, valueClosed: { not: null } },
    _sum: { valueClosed: true },
    orderBy: { _sum: { valueClosed: "desc" } },
    take: 5,
  });
  return rows.map((r) => ({
    name: r.treatmentName,
    value: r._sum.valueClosed ?? 0,
  }));
}

export async function getClientStats() {
  const periodStart = daysAgo(PERIOD_DAYS);
  const [active, newPatients, all, avgSat] = await Promise.all([
    db.patient.count({ where: { status: "ATIVA" } }),
    db.patient.count({ where: { createdAt: { gte: periodStart } } }),
    db.patient.findMany({ select: { id: true } }),
    db.patient.aggregate({ _avg: { satisfaction: true } }),
  ]);

  const patientsWithMultiple = await db.consultation.groupBy({
    by: ["patientId"],
    _count: { id: true },
  });
  const returning = patientsWithMultiple.filter((p) => p._count.id > 1).length;
  const retentionRate = all.length ? (returning / all.length) * 100 : 0;

  return {
    active,
    newPatients,
    retentionRate,
    avgSatisfaction: avgSat._avg.satisfaction ?? 0,
  };
}

function professionalScore(revenue: number, maxRevenue: number, conversion: number, avgAi: number | null) {
  const revenueNorm = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
  const aiNorm = avgAi !== null ? avgAi * 10 : 75;
  return Math.round(0.4 * revenueNorm + 0.3 * conversion + 0.3 * aiNorm);
}

export async function getProfessionalsRanking() {
  const periodStart = daysAgo(PERIOD_DAYS);
  const pros = await db.professional.findMany({ where: { active: true } });

  const stats = await Promise.all(
    pros.map(async (p) => {
      const consultations = await db.consultation.findMany({
        where: { professionalId: p.id, occurredAt: { gte: periodStart } },
        select: { valueClosed: true, aiScore: true },
      });
      const revenue = consultations.reduce((acc, c) => acc + (c.valueClosed ?? 0), 0);
      const closedCount = consultations.filter((c) => c.valueClosed !== null).length;
      const conversion = consultations.length ? (closedCount / consultations.length) * 100 : 0;
      const graded = consultations.filter((c) => c.aiScore !== null);
      const avgAi = graded.length
        ? graded.reduce((acc, c) => acc + (c.aiScore ?? 0), 0) / graded.length
        : null;
      return { professional: p, revenue, conversion, avgAi, consultCount: consultations.length };
    })
  );

  const maxRevenue = Math.max(...stats.map((s) => s.revenue), 1);

  return stats
    .map((s) => ({
      ...s,
      score: professionalScore(s.revenue, maxRevenue, s.conversion, s.avgAi),
    }))
    .sort((a, b) => b.score - a.score);
}

export async function getProfessionalProfile(id: string) {
  const periodStart = daysAgo(PERIOD_DAYS);
  const professional = await db.professional.findUnique({ where: { id } });
  if (!professional) return null;

  const consultations = await db.consultation.findMany({
    where: { professionalId: id, occurredAt: { gte: periodStart } },
    select: { valueClosed: true, aiScore: true },
  });
  const revenue = consultations.reduce((acc, c) => acc + (c.valueClosed ?? 0), 0);
  const closedCount = consultations.filter((c) => c.valueClosed !== null).length;
  const conversion = consultations.length ? (closedCount / consultations.length) * 100 : 0;
  const graded = consultations.filter((c) => c.aiScore !== null);
  const avgAi = graded.length
    ? graded.reduce((acc, c) => acc + (c.aiScore ?? 0), 0) / graded.length
    : null;

  const recentConsultations = await db.consultation.findMany({
    where: { professionalId: id },
    orderBy: { occurredAt: "desc" },
    take: 6,
    include: { patient: true },
  });

  const ranking = await getProfessionalsRanking();
  const rankIndex = ranking.findIndex((r) => r.professional.id === id);

  return {
    professional,
    revenue,
    conversion,
    avgAi,
    consultCount: consultations.length,
    recentConsultations,
    rank: rankIndex >= 0 ? rankIndex + 1 : ranking.length,
    score: rankIndex >= 0 ? ranking[rankIndex].score : 0,
  };
}

export async function getClinicAvgScore() {
  const agg = await db.consultation.aggregate({ _avg: { aiScore: true } });
  return agg._avg.aiScore ?? 0;
}

export async function getPatientsList() {
  return db.patient.findMany({
    include: { professional: true },
    orderBy: { name: "asc" },
  });
}

export async function getPatientDetail(id: string) {
  const patient = await db.patient.findUnique({
    where: { id },
    include: { professional: true },
  });
  if (!patient) return null;

  const consultations = await db.consultation.findMany({
    where: { patientId: id },
    select: { valueClosed: true },
  });
  const closed = consultations.filter((c) => c.valueClosed !== null);
  const ltv = closed.reduce((acc, c) => acc + (c.valueClosed ?? 0), 0);
  const ticket = closed.length ? ltv / closed.length : 0;

  return { patient, ltv, ticket, consultCount: consultations.length };
}

export function tagStyleForStatus(status: "ATIVA" | "NOVA" | "EM_RISCO") {
  switch (status) {
    case "ATIVA":
      return { bg: "var(--goodbg)", color: "var(--good)", label: "Ativa" };
    case "NOVA":
      return { bg: "var(--goldsoft)", color: "var(--gold)", label: "Nova" };
    case "EM_RISCO":
      return { bg: "var(--badbg)", color: "var(--bad)", label: "Em risco" };
  }
}
