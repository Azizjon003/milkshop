import ExcelJS from "exceljs";
import { prisma } from "../prisma";
import path from "path";
import fs from "fs";
import os from "os";

interface ReportFilter {
  from?: Date;
  to?: Date;
}

function dateFilter(field: string, filter: ReportFilter) {
  if (!filter.from && !filter.to) return {};
  const where: any = {};
  where[field] = {};
  if (filter.from) where[field].gte = filter.from;
  if (filter.to) where[field].lt = filter.to;
  return where;
}

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E7D32" },
    };
    cell.alignment = { horizontal: "center" };
    cell.border = {
      bottom: { style: "thin" },
    };
  });
}

function formatTitle(filter: ReportFilter): string {
  if (!filter.from && !filter.to) return "Umumiy hisobot";
  const fmt = (d: Date) =>
    `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}.${d.getFullYear()}`;
  if (filter.from && filter.to) return `Hisobot: ${fmt(filter.from)} — ${fmt(filter.to)}`;
  if (filter.from) return `Hisobot: ${fmt(filter.from)} dan`;
  return `Hisobot: ${fmt(filter.to!)} gacha`;
}

export async function generateReport(filter: ReportFilter): Promise<string> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Milkshop Bot";

  // ========== KIRIMLAR SHEET ==========
  const incomeSheet = wb.addWorksheet("Kirimlar");
  incomeSheet.columns = [
    { header: "Sana", key: "date", width: 14 },
    { header: "Turi", key: "type", width: 22 },
    { header: "Miqdor", key: "quantity", width: 12 },
    { header: "Birlik", key: "unit", width: 10 },
    { header: "Narx", key: "price", width: 18 },
    { header: "Summa", key: "total", width: 20 },
    { header: "Izoh", key: "comment", width: 25 },
  ];
  styleHeader(incomeSheet.getRow(1));

  const incomes = await prisma.income.findMany({
    where: dateFilter("incomeDate", filter),
    include: { type: true },
    orderBy: { incomeDate: "asc" },
  });

  let incomeTotal = 0;
  for (const i of incomes) {
    const total = Number(i.totalAmount);
    incomeTotal += total;
    incomeSheet.addRow({
      date: i.incomeDate.toLocaleDateString("uz-UZ"),
      type: i.type.name,
      quantity: Number(i.quantity),
      unit: i.type.unit,
      price: Number(i.pricePerUnit),
      total,
      comment: i.comment || "",
    });
  }

  // Jami qator
  const incTotalRow = incomeSheet.addRow({
    date: "",
    type: "",
    quantity: "",
    unit: "",
    price: "JAMI:",
    total: incomeTotal,
    comment: "",
  });
  incTotalRow.font = { bold: true };

  // Summa ustunini format
  incomeSheet.getColumn("price").numFmt = "#,##0";
  incomeSheet.getColumn("total").numFmt = "#,##0";

  // ========== CHIQIMLAR SHEET ==========
  const expenseSheet = wb.addWorksheet("Chiqimlar");
  expenseSheet.columns = [
    { header: "Sana", key: "date", width: 14 },
    { header: "Kategoriya", key: "category", width: 25 },
    { header: "Summa", key: "amount", width: 20 },
    { header: "Izoh", key: "comment", width: 30 },
  ];
  styleHeader(expenseSheet.getRow(1));

  const expenses = await prisma.expense.findMany({
    where: dateFilter("expenseDate", filter),
    include: { category: true },
    orderBy: { expenseDate: "asc" },
  });

  let expenseTotal = 0;
  for (const e of expenses) {
    const amt = Number(e.amount);
    expenseTotal += amt;
    expenseSheet.addRow({
      date: e.expenseDate.toLocaleDateString("uz-UZ"),
      category: e.category.name,
      amount: amt,
      comment: e.comment || "",
    });
  }

  const expTotalRow = expenseSheet.addRow({
    date: "",
    category: "JAMI:",
    amount: expenseTotal,
    comment: "",
  });
  expTotalRow.font = { bold: true };
  expenseSheet.getColumn("amount").numFmt = "#,##0";

  // ========== QARZLAR SHEET ==========
  const debtSheet = wb.addWorksheet("Qarzlar");
  debtSheet.columns = [
    { header: "Sana", key: "date", width: 14 },
    { header: "Firma", key: "firm", width: 25 },
    { header: "Turi", key: "type", width: 15 },
    { header: "Summa", key: "amount", width: 20 },
    { header: "Izoh", key: "comment", width: 30 },
  ];
  styleHeader(debtSheet.getRow(1));

  const debts = await prisma.debtTransaction.findMany({
    where: dateFilter("transactionDate", filter),
    include: { firm: true },
    orderBy: { transactionDate: "asc" },
  });

  for (const d of debts) {
    debtSheet.addRow({
      date: d.transactionDate.toLocaleDateString("uz-UZ"),
      firm: d.firm.name,
      type: d.type === "DEBT" ? "Qarz berdi" : "To'ladi",
      amount: Number(d.amount),
      comment: d.comment || "",
    });
  }

  debtSheet.getColumn("amount").numFmt = "#,##0";

  // Firma qoldiqlari
  debtSheet.addRow({});
  const firmHeader = debtSheet.addRow({
    date: "Firma",
    firm: "",
    type: "",
    amount: "Qarz qoldig'i",
    comment: "",
  });
  firmHeader.font = { bold: true };

  const firms = await prisma.firm.findMany();
  let grandDebt = 0;
  for (const firm of firms) {
    const result = await prisma.debtTransaction.groupBy({
      by: ["type"],
      where: { firmId: firm.id },
      _sum: { amount: true },
    });
    let d = 0, p = 0;
    for (const r of result) {
      const sum = Number(r._sum.amount) || 0;
      if (r.type === "DEBT") d = sum;
      if (r.type === "PAYMENT") p = sum;
    }
    const balance = d - p;
    if (balance !== 0) {
      debtSheet.addRow({
        date: firm.name,
        firm: "",
        type: "",
        amount: balance,
        comment: "",
      });
      grandDebt += balance;
    }
  }

  const debtTotalRow = debtSheet.addRow({
    date: "JAMI QARZ:",
    firm: "",
    type: "",
    amount: grandDebt,
    comment: "",
  });
  debtTotalRow.font = { bold: true };

  // ========== XULOSA SHEET ==========
  const summarySheet = wb.addWorksheet("Xulosa");
  summarySheet.columns = [
    { header: "Ko'rsatkich", key: "label", width: 30 },
    { header: "Summa", key: "value", width: 25 },
  ];
  styleHeader(summarySheet.getRow(1));

  summarySheet.addRow({ label: formatTitle(filter), value: "" });
  summarySheet.addRow({ label: "", value: "" });
  summarySheet.addRow({ label: "Jami kirim", value: incomeTotal });
  summarySheet.addRow({ label: "Jami chiqim", value: expenseTotal });
  const profitRow = summarySheet.addRow({
    label: "Foyda",
    value: incomeTotal - expenseTotal,
  });
  profitRow.font = { bold: true };
  summarySheet.addRow({ label: "", value: "" });
  summarySheet.addRow({ label: "Jami qarz qoldig'i", value: grandDebt });
  summarySheet.getColumn("value").numFmt = "#,##0";

  // Faylga saqlash
  const filePath = path.join(os.tmpdir(), `hisobot_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}
