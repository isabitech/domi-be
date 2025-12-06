import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import ReportsService from '../services/ReportsService.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// @desc    Generate Daily Branch Report
// @route   GET /api/reports/daily
// @access  Private
class ReportsController {
  getDailyReport = asyncHandler(async (req, res) => {
    const reportData = await ReportsService.daily(req);
    success(res, { reportData }, 'Daily report generated');
  });
  exportDailyReport = asyncHandler(async (req, res) => {
    const reportData = await ReportsService.daily(req);
    const format = req.query.format || 'excel';
    if (format === 'pdf') return this.#exportPDF(res, 'daily-report.pdf', doc => {
      doc.text('Daily Report');
      reportData.operations.forEach(o => {
        doc.text(`${o.branch.name} (${o.branch.code}) Savings:${o.cashbook1.savings} Loan:${o.cashbook1.loanCollection} Disb:${o.cashbook2.disAmt} OnlineCIH:${o.calculated.onlineCIH}`);
      });
    });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Daily');
    sheet.addRow(['Branch', 'Code', 'Savings', 'Loan Collection', 'Charges', 'Disbursements', 'Withdrawals', 'Online CIH', 'TSO']);
    reportData.operations.forEach(o => {
      sheet.addRow([o.branch.name, o.branch.code, o.cashbook1.savings, o.cashbook1.loanCollection, o.cashbook1.chargesCollection, o.cashbook2.disAmt, o.cashbook2.savWith, o.calculated.onlineCIH, o.calculated.tso]);
    });
    return this.#exportExcel(res, 'daily-report.xlsx', workbook);
  });

// @desc    Generate Monthly Summary Report
// @route   GET /api/reports/monthly
// @access  Private
  getMonthlyReport = asyncHandler(async (req, res) => {
    const reportData = await ReportsService.monthly(req);
    success(res, { reportData }, 'Monthly report generated');
  });
  exportMonthlyReport = asyncHandler(async (req, res) => {
    const reportData = await ReportsService.monthly(req);
    const format = req.query.format || 'excel';
    if (format === 'pdf') return this.#exportPDF(res, 'monthly-report.pdf', doc => {
      doc.text(`Monthly Report ${reportData.month}/${reportData.year}`);
      reportData.monthlySummary.forEach(m => {
        doc.text(`${m.branchName} Savings:${m.totalSavings} Loan:${m.totalLoanCollection} Disb:${m.totalDisbursements}`);
      });
    });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('MonthlySummary');
    sheet.addRow(['Branch', 'Code', 'Savings', 'Loan Collection', 'Charges', 'Disbursements', 'Withdrawals', 'TSO', 'Avg Online CIH', 'Days']);
    reportData.monthlySummary.forEach(m => {
      sheet.addRow([m.branchName, m.branchCode, m.totalSavings, m.totalLoanCollection, m.totalCharges, m.totalDisbursements, m.totalWithdrawals, m.totalTSO, m.avgOnlineCIH, m.operatingDays]);
    });
    return this.#exportExcel(res, 'monthly-report.xlsx', workbook);
  });

// @desc    Generate HO Consolidated Report
// @route   GET /api/reports/consolidated
// @access  Private (HO only)
  getConsolidatedReport = asyncHandler(async (req, res) => {
    const reportData = await ReportsService.consolidated(req);
    success(res, { reportData }, 'Consolidated report generated');
  });
  exportConsolidatedReport = asyncHandler(async (req, res) => {
    const reportData = await ReportsService.consolidated(req);
    const format = req.query.format || 'excel';
    if (format === 'pdf') return this.#exportPDF(res, 'consolidated-report.pdf', doc => {
      doc.text('Consolidated Report');
      reportData.consolidatedData.forEach(c => {
        doc.text(`${c.branchName} Savings:${c.totalSavings} Loan:${c.totalLoanCollection} Disb:${c.totalDisbursements}`);
      });
    });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Consolidated');
    sheet.addRow(['Branch', 'Code', 'Savings', 'Loan Collection', 'Charges', 'Disbursements', 'Withdrawals', 'TSO', 'Avg Online CIH', 'Operating Days']);
    reportData.consolidatedData.forEach(c => {
      sheet.addRow([c.branchName, c.branchCode, c.totalSavings, c.totalLoanCollection, c.totalCharges, c.totalDisbursements, c.totalWithdrawals, c.totalTSO, c.avgOnlineCIH, c.operatingDays]);
    });
    return this.#exportExcel(res, 'consolidated-report.xlsx', workbook);
  });

// @desc    Generate Custom Report
// @route   GET /api/reports/custom
// @access  Private
  getCustomReport = asyncHandler(async (req, res) => {
    const reportData = await ReportsService.custom(req);
    success(res, { reportData }, 'Custom report generated');
  });
  exportCustomReport = asyncHandler(async (req, res) => {
    const reportData = await ReportsService.custom(req);
    const format = req.query.format || 'excel';
    if (format === 'pdf') return this.#exportPDF(res, 'custom-report.pdf', doc => {
      doc.text('Custom Report');
      reportData.results.forEach(r => {
        doc.text(`${r.branchName} Savings:${r.totalSavings} Loan:${r.totalLoanCollection} Disb:${r.totalDisbursements}`);
      });
    });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Custom');
    sheet.addRow(['Branch', 'Code', 'Savings', 'Loan Collection', 'Charges', 'Disbursements', 'Withdrawals', 'TSO', 'Avg Online CIH', 'Operations']);
    reportData.results.forEach(r => {
      sheet.addRow([r.branchName, r.branchCode, r.totalSavings, r.totalLoanCollection, r.totalCharges, r.totalDisbursements, r.totalWithdrawals, r.totalTSO, r.avgOnlineCIH, r.operationCount]);
    });
    return this.#exportExcel(res, 'custom-report.xlsx', workbook);
  });

  #exportExcel(res, filename, workbook) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return workbook.xlsx.write(res).then(() => res.end());
  }

  #exportPDF(res, filename, build) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    const doc = new PDFDocument({ margin: 30 });
    doc.pipe(res);
    build(doc);
    doc.end();
  }
}

const reportsController = new ReportsController();
export default reportsController;