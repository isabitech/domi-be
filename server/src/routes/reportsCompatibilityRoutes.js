import express from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../utils/permissions.js';
import ReportsService from '../services/ReportsService.js';

const router = express.Router();

// Compatibility endpoint matching spec: GET /reports/financial
// Map query params to existing ReportsService.custom and return spec-shaped result.
router.get('/financial', protect, requirePermission('reports:view'), async (req, res, next) => {
  try {
    // Build a shallow-cloned request object with adjusted query params
    const clonedReq = Object.assign({}, req, {
      query: Object.assign({}, req.query, {
        branchIds: req.query.branchIds || req.query.branchId
      })
    });

    const reportData = await ReportsService.custom(clonedReq);

    // Build summary by aggregating results
    const results = reportData.results || [];
    const totals = results.reduce((acc, r) => {
      acc.totalSavings += r.totalSavings || 0;
      acc.totalLoans += r.totalLoanCollection || 0;
      acc.totalDisbursements += r.totalDisbursements || 0;
      acc.totalCharges += r.totalCharges || 0;
      acc.totalWithdrawals += r.totalWithdrawals || 0;
      acc.totalTSO += r.totalTSO || 0;
      return acc;
    }, { totalSavings: 0, totalLoans: 0, totalDisbursements: 0, totalCharges: 0, totalWithdrawals: 0, totalTSO: 0 });

    const totalIncome = totals.totalSavings + totals.totalLoans;
    const totalExpenses = totals.totalCharges + totals.totalDisbursements + totals.totalWithdrawals;
    const netProfit = totalIncome - totalExpenses;

    const summary = {
      totalIncome,
      totalExpenses,
      netProfit,
      totalSavings: totals.totalSavings,
      totalLoans: totals.totalLoans,
      totalDisbursements: totals.totalDisbursements,
      totalCharges: totals.totalCharges,
      totalTransferToSenate: totals.totalTSO,
      profitMargin: totalIncome ? (netProfit / totalIncome) * 100 : 0,
      growthRate: null
    };

    const details = results.map(r => {
      const cashbook1Total = (r.totalSavings || 0) + (r.totalLoanCollection || 0) + (r.totalCharges || 0);
      const cashbook2Total = (r.totalDisbursements || 0) + (r.totalWithdrawals || 0);
      return {
        branchId: r._id && r._id.branch ? r._id.branch : null,
        branchName: r.branchName || null,
        date: r.period ? (new Date(r.period)).toISOString().slice(0,10) : null,
        cashbook1Total,
        cashbook2Total,
        onlineCIH: r.avgOnlineCIH || 0,
        savings: r.totalSavings || 0,
        loanCollection: r.totalLoanCollection || 0,
        disbursements: r.totalDisbursements || 0,
        charges: r.totalCharges || 0,
        expenses: r.totalWithdrawals || 0,
        transferToSenate: r.totalTSO || 0,
        frmHO: 0,
        frmBR: 0,
        netCashFlow: cashbook1Total - cashbook2Total
      };
    });

    return res.json({ success: true, data: { summary, details } });
  } catch (err) {
    next(err);
  }
});

export default router;
