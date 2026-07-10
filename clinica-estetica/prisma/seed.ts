import "dotenv/config";
import { PrismaClient, PatientStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const MS_DAY = 24 * 60 * 60 * 1000;

const TREATMENTS = [
  { name: "Harmonização facial", min: 2400, max: 4200 },
  { name: "Toxina botulínica", min: 1200, max: 2200 },
  { name: "Preenchimento labial", min: 1400, max: 2600 },
  { name: "Laser CO₂", min: 900, max: 2000 },
  { name: "Skinbooster", min: 700, max: 1500 },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.round(rand(min, max));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Seeding banco de dados da Élan...");

  const adminEmail = "helena@elanclinic.com.br";
  const adminPassword = "elan2026";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Dra. Helena Viana",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  const proDefs = [
    { name: "Dra. Marina Costa", specialty: "Harmonização Facial" },
    { name: "Dr. Rafael Almeida", specialty: "Toxina & Preenchimento" },
    { name: "Dra. Beatriz Nunes", specialty: "Tricologia & Skinbooster" },
    { name: "Dra. Camila Rocha", specialty: "Estética Corporal" },
    { name: "Dr. Thiago Mendes", specialty: "Laser & Peelings" },
  ];

  const pros = [];
  for (const p of proDefs) {
    const existing = await db.professional.findFirst({ where: { name: p.name } });
    pros.push(
      existing ??
        (await db.professional.create({ data: { name: p.name, specialty: p.specialty } }))
    );
  }

  const patientDefs: Array<{
    name: string;
    phone: string;
    age: number;
    since: Date;
    status: PatientStatus;
    currentTreatment: string;
    nextAppointment: Date | null;
    history: string[];
    clinicalNotes: string;
    aiTip: string;
    satisfaction: number | null;
    proIndex: number;
  }> = [
    {
      name: "Ana Lima",
      phone: "(11) 98221-4407",
      age: 34,
      since: new Date("2025-03-10"),
      status: "ATIVA",
      currentTreatment: "Harmonização facial · sessão 1 de 3",
      nextAppointment: new Date(Date.now() + 4 * MS_DAY),
      history: ["Toxina botulínica", "Skinbooster", "Limpeza profunda"],
      clinicalNotes: "Sensibilidade a AAS — confirmar suspensão 7 dias antes de procedimentos injetáveis.",
      aiTip: "Perfil que valoriza naturalidade: apresente resultados sutis e evite fotos com transformações drásticas. Alta propensão a fechar planos de múltiplas sessões.",
      satisfaction: 5.0,
      proIndex: 0,
    },
    {
      name: "Paula Souza",
      phone: "(11) 97310-8852",
      age: 41,
      since: new Date("2024-01-15"),
      status: "ATIVA",
      currentTreatment: "Preenchimento labial · manutenção",
      nextAppointment: new Date(Date.now() + 8 * MS_DAY),
      history: ["Preenchimento labial", "Toxina botulínica", "Laser CO₂", "Bioestimulador"],
      clinicalNotes: "Histórico de herpes labial — prescrever profilaxia antiviral antes de procedimentos periorais.",
      aiTip: "Cliente recorrente e de alto valor: ofereça o programa anual de manutenção com agenda preferencial antes que ela pergunte.",
      satisfaction: 4.8,
      proIndex: 0,
    },
    {
      name: "Juliana Martins",
      phone: "(21) 99640-2218",
      age: 28,
      since: new Date("2026-06-20"),
      status: "NOVA",
      currentTreatment: "Interesse: toxina botulínica (preventiva)",
      nextAppointment: new Date(Date.now() + 1 * MS_DAY),
      history: [],
      clinicalNotes: "Sem restrições registradas. Preencher anamnese completa na primeira consulta.",
      aiTip: "Primeira visita, veio por indicação. Mencione a indicação para criar vínculo; comece com procedimento de entrada e plano de evolução.",
      satisfaction: null,
      proIndex: 1,
    },
    {
      name: "Renata Freitas",
      phone: "(11) 96155-0934",
      age: 47,
      since: new Date("2024-08-05"),
      status: "ATIVA",
      currentTreatment: "Bioestimulador de colágeno · sessão 2 de 3",
      nextAppointment: new Date(Date.now() + 12 * MS_DAY),
      history: ["Bioestimulador", "Ultrassom microfocado", "Peeling químico"],
      clinicalNotes: "Hipotireoidismo controlado (levotiroxina). Sem contraindicações aos protocolos atuais.",
      aiTip: "Já perguntou 2x sobre ultrassom microfocado no pescoço — leve uma proposta pronta na próxima sessão.",
      satisfaction: 4.9,
      proIndex: 2,
    },
    {
      name: "Camila Duarte",
      phone: "(31) 98877-1265",
      age: 36,
      since: new Date("2025-10-12"),
      status: "EM_RISCO",
      currentTreatment: "Sem tratamento ativo · último há 74 dias",
      nextAppointment: null,
      history: ["Drenagem modeladora", "Criolipólise"],
      clinicalNotes: "Sem restrições clínicas registradas.",
      aiTip: "74 dias sem retorno e satisfação abaixo da média. Sugestão: contato pessoal da profissional (não da recepção) com convite para avaliação de cortesia.",
      satisfaction: 4.2,
      proIndex: 3,
    },
    {
      name: "Beatriz Campos",
      phone: "(11) 95522-7741",
      age: 52,
      since: new Date("2025-02-18"),
      status: "ATIVA",
      currentTreatment: "Laser CO₂ fracionado · sessão 3 de 4",
      nextAppointment: new Date(Date.now() + 6 * MS_DAY),
      history: ["Laser CO₂", "Peeling químico", "Skinbooster"],
      clinicalNotes: "Fototipo III — reforçar fotoproteção rigorosa no pós-laser; histórico de melasma.",
      aiTip: "Excelente adesão ao protocolo. Ao concluir o ciclo de laser, proponha o skinbooster de manutenção semestral — perfil com alta aceitação.",
      satisfaction: 5.0,
      proIndex: 4,
    },
  ];

  const patients = [];
  for (const p of patientDefs) {
    const existing = await db.patient.findFirst({ where: { name: p.name } });
    const record =
      existing ??
      (await db.patient.create({
        data: {
          name: p.name,
          phone: p.phone,
          age: p.age,
          clientSince: p.since,
          createdAt: p.since,
          status: p.status,
          currentTreatment: p.currentTreatment,
          nextAppointment: p.nextAppointment,
          treatmentHistory: p.history,
          clinicalNotes: p.clinicalNotes,
          aiTip: p.aiTip,
          aiTipAt: new Date(),
          satisfaction: p.satisfaction,
          professionalId: pros[p.proIndex].id,
        },
      }));
    patients.push(record);
  }

  const existingConsults = await db.consultation.count();
  if (existingConsults === 0) {
    console.log("Gerando histórico de consultas (60 dias)...");
    const rows = [];
    for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
      const day = new Date(Date.now() - dayOffset * MS_DAY);
      const consultsToday = randInt(2, 6);
      for (let i = 0; i < consultsToday; i++) {
        const pro = pick(pros);
        const patient = pick(patients);
        const treatment = pick(TREATMENTS);
        const closed = Math.random() < 0.66;
        const occurredAt = new Date(day);
        occurredAt.setHours(randInt(9, 18), randInt(0, 59), 0, 0);
        const hasGrade = Math.random() < 0.7;

        rows.push({
          patientId: patient.id,
          professionalId: pro.id,
          treatmentName: treatment.name,
          occurredAt,
          durationSeconds: randInt(8, 32) * 60,
          valueClosed: closed ? Math.round(rand(treatment.min, treatment.max)) : null,
          aiScore: hasGrade ? Math.round(rand(65, 98)) / 10 : null,
        });
      }
    }
    await db.consultation.createMany({ data: rows });
    console.log(`Criadas ${rows.length} consultas.`);
  }

  console.log("\nSeed concluído.");
  console.log(`Login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
