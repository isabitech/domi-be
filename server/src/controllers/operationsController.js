const Cashbook1 = require('../models/Cashbook1');
const Cashbook2 = require('../models/Cashbook2');
const LoanRegister = require('../models/LoanRegister');
const SavingsRegister = require('../models/SavingsRegister');
const Prediction = require('../models/Prediction');
const BankStatement1 = require('../models/BankStatement1');
const BankStatement2 = require('../models/BankStatement2');
const DailyOperations = require('../models/DailyOperations');
const DisbursementRoll = require('../models/DisbursementRoll');
const Branch = require('../models/Branch');

// @desc    Get daily operations for a branch
// @route   GET /api/operations/daily
// @access  Private
const getDailyOperations = async (req, res) => {
  try {
    const { date, branchId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Set date range for the day
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    let query = { 
      date: { $gte: startOfDay, $lt: endOfDay }
    };

    // Role-based filtering
    if (req.user.role === 'BR') {
      query.branch = req.user.branch;
    } else if (branchId) {
      query.branch = branchId;
    }

    const operations = await DailyOperations.findOne(query)
      .populate('branch', 'name code')
      .populate('user', 'name email')
      .populate('cashbook1')
      .populate('cashbook2')
      .populate('prediction')
      .populate('bankStatement1')
      .populate('bankStatement2')
      .populate('loanRegister')
      .populate('savingsRegister');

    res.json({
      success: true,
      data: operations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create or update daily operations
// @route   POST /api/operations/daily
// @access  Private (BR only)
const createOrUpdateDailyOperations = async (req, res) => {
  try {
    if (req.user.role !== 'BR') {
      return res.status(403).json({
        success: false,
        message: 'Only branch users can create daily operations'
      });
    }

    const { 
      date,
      // Cashbook1 data
      pcih, savings, loanCollection, chargesCollection,
      // Cashbook2 data
      disNo, disAmt, disWithInt, savWith, domiBank, posT,
      // Prediction data
      predictionNo, predictionAmount,
      // BankStatement2 data (BR editable fields)
      exAmt, exPurpose
    } = req.body;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Check if operations already exist for this date
    let dailyOps = await DailyOperations.findOne({
      branch: req.user.branch,
      date: { $gte: startOfDay, $lt: endOfDay }
    });

    // Create or update Cashbook1
    let cashbook1 = dailyOps?.cashbook1 ? 
      await Cashbook1.findById(dailyOps.cashbook1) : 
      new Cashbook1();
    
    cashbook1.branch = req.user.branch;
    cashbook1.user = req.user.id;
    cashbook1.date = targetDate;
    cashbook1.pcih = pcih || 0;
    cashbook1.savings = savings || 0;
    cashbook1.loanCollection = loanCollection || 0;
    cashbook1.chargesCollection = chargesCollection || 0;
    await cashbook1.save();

    // Create or update Cashbook2
    let cashbook2 = dailyOps?.cashbook2 ? 
      await Cashbook2.findById(dailyOps.cashbook2) : 
      new Cashbook2();
    
    cashbook2.branch = req.user.branch;
    cashbook2.user = req.user.id;
    cashbook2.date = targetDate;
    cashbook2.disNo = disNo || 0;
    cashbook2.disAmt = disAmt || 0;
    cashbook2.disWithInt = disWithInt || 0;
    cashbook2.savWith = savWith || 0;
    cashbook2.domiBank = domiBank || 0;
    cashbook2.posT = posT || 0;
    await cashbook2.save();

    // Create or update Prediction
    let prediction = dailyOps?.prediction ? 
      await Prediction.findById(dailyOps.prediction) : 
      new Prediction();
    
    prediction.branch = req.user.branch;
    prediction.user = req.user.id;
    prediction.date = targetDate;
    prediction.predictionDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000); // Next day
    prediction.predictionNo = predictionNo || 0;
    prediction.predictionAmount = predictionAmount || 0;
    await prediction.save();

    // Create or update BankStatement1 (system calculated)
    let bs1 = dailyOps?.bankStatement1 ? 
      await BankStatement1.findById(dailyOps.bankStatement1) : 
      new BankStatement1();
    
    bs1.branch = req.user.branch;
    bs1.date = targetDate;
    bs1.recHO = cashbook1.frmHO;
    bs1.recBO = cashbook1.frmBR;
    bs1.domi = cashbook2.domiBank;
    bs1.pa = cashbook2.posT;
    await bs1.save();

    // Create or update BankStatement2
    let bs2 = dailyOps?.bankStatement2 ? 
      await BankStatement2.findById(dailyOps.bankStatement2) : 
      new BankStatement2();
    
    bs2.branch = req.user.branch;
    bs2.user = req.user.id;
    bs2.date = targetDate;
    bs2.withd = cashbook1.frmHO; // From FRM HO
    bs2.exAmt = exAmt || 0;
    bs2.exPurpose = exPurpose || '';
    await bs2.save();

    // Create or update Loan Register
    let loanRegister = dailyOps?.loanRegister ? 
      await LoanRegister.findById(dailyOps.loanRegister) : 
      new LoanRegister();
    
    const branch = await Branch.findById(req.user.branch);
    loanRegister.branch = req.user.branch;
    loanRegister.date = targetDate;
    loanRegister.previousLoanTotal = branch.previousLoanTotal;
    loanRegister.loanDisbursementWithInterest = cashbook2.disWithInt;
    loanRegister.loanCollection = cashbook1.loanCollection;
    await loanRegister.save();

    // Create or update Savings Register
    let savingsRegister = dailyOps?.savingsRegister ? 
      await SavingsRegister.findById(dailyOps.savingsRegister) : 
      new SavingsRegister();
    
    savingsRegister.branch = req.user.branch;
    savingsRegister.date = targetDate;
    savingsRegister.previousSavingsTotal = branch.previousSavingsTotal;
    savingsRegister.savings = cashbook1.savings;
    savingsRegister.savingsWithdrawal = cashbook2.savWith;
    await savingsRegister.save();

    // Create or update Daily Operations
    if (!dailyOps) {
      dailyOps = new DailyOperations();
      dailyOps.branch = req.user.branch;
      dailyOps.user = req.user.id;
      dailyOps.date = targetDate;
    }

    dailyOps.cashbook1 = cashbook1._id;
    dailyOps.cashbook2 = cashbook2._id;
    dailyOps.prediction = prediction._id;
    dailyOps.bankStatement1 = bs1._id;
    dailyOps.bankStatement2 = bs2._id;
    dailyOps.loanRegister = loanRegister._id;
    dailyOps.savingsRegister = savingsRegister._id;

    // Calculate derived values
    dailyOps.onlineCIH = cashbook1.cbTotal1 - cashbook2.cbTotal2;
    dailyOps.tso = bs1.bs1Total - bs2.bs2Total;

    await dailyOps.save();

    // Populate and return the complete data
    await dailyOps.populate([
      { path: 'branch', select: 'name code' },
      { path: 'user', select: 'name email' },
      { path: 'cashbook1' },
      { path: 'cashbook2' },
      { path: 'prediction' },
      { path: 'bankStatement1' },
      { path: 'bankStatement2' },
      { path: 'loanRegister' },
      { path: 'savingsRegister' }
    ]);

    res.status(201).json({
      success: true,
      data: dailyOps
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit daily operations
// @route   PATCH /api/operations/daily/:id/submit
// @access  Private (BR only)
const submitDailyOperations = async (req, res) => {
  try {
    const dailyOps = await DailyOperations.findById(req.params.id);
    
    if (!dailyOps) {
      return res.status(404).json({
        success: false,
        message: 'Daily operations not found'
      });
    }

    if (dailyOps.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this record'
      });
    }

    dailyOps.isCompleted = true;
    dailyOps.submittedAt = new Date();
    await dailyOps.save();

    // Update related records
    if (dailyOps.cashbook1) {
      await Cashbook1.findByIdAndUpdate(dailyOps.cashbook1, { 
        isSubmitted: true, 
        submittedAt: new Date() 
      });
    }

    if (dailyOps.cashbook2) {
      await Cashbook2.findByIdAndUpdate(dailyOps.cashbook2, { 
        isSubmitted: true, 
        submittedAt: new Date() 
      });
    }

    res.json({
      success: true,
      message: 'Daily operations submitted successfully',
      data: dailyOps
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update HO fields
// @route   PATCH /api/operations/ho-fields
// @access  Private (HO only)
const updateHOFields = async (req, res) => {
  try {
    if (req.user.role !== 'HO') {
      return res.status(403).json({
        success: false,
        message: 'Only Head Office can update these fields'
      });
    }

    const { 
      branchId, 
      date, 
      frmHO, 
      frmBR, 
      tbo, 
      tboTargetBranch,
      previousLoanTotal,
      previousSavingsTotal,
      previousDisbursement
    } = req.body;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Update branch previous totals if provided
    if (previousLoanTotal !== undefined || previousSavingsTotal !== undefined || previousDisbursement !== undefined) {
      const updateData = {};
      if (previousLoanTotal !== undefined) updateData.previousLoanTotal = previousLoanTotal;
      if (previousSavingsTotal !== undefined) updateData.previousSavingsTotal = previousSavingsTotal;
      if (previousDisbursement !== undefined) updateData.previousDisbursement = previousDisbursement;
      
      await Branch.findByIdAndUpdate(branchId, updateData);
    }

    const dailyOps = await DailyOperations.findOne({
      branch: branchId,
      date: { $gte: startOfDay, $lt: endOfDay }
    });

    if (!dailyOps) {
      return res.status(404).json({
        success: false,
        message: 'Daily operations not found for this date'
      });
    }

    // Update Cashbook1 HO fields
    if (dailyOps.cashbook1 && (frmHO !== undefined || frmBR !== undefined)) {
      const updateData = {};
      if (frmHO !== undefined) updateData.frmHO = frmHO;
      if (frmBR !== undefined) updateData.frmBR = frmBR;
      
      await Cashbook1.findByIdAndUpdate(dailyOps.cashbook1, updateData);
    }

    // Update BankStatement2 HO fields
    if (dailyOps.bankStatement2 && (tbo !== undefined || tboTargetBranch !== undefined)) {
      const updateData = {};
      if (tbo !== undefined) updateData.tbo = tbo;
      if (tboTargetBranch !== undefined) updateData.tboTargetBranch = tboTargetBranch;
      
      await BankStatement2.findByIdAndUpdate(dailyOps.bankStatement2, updateData);
    }

    // Recalculate derived values
    const cashbook1 = await Cashbook1.findById(dailyOps.cashbook1);
    const cashbook2 = await Cashbook2.findById(dailyOps.cashbook2);
    const bs1 = await BankStatement1.findById(dailyOps.bankStatement1);
    const bs2 = await BankStatement2.findById(dailyOps.bankStatement2);

    if (cashbook1 && cashbook2) {
      dailyOps.onlineCIH = cashbook1.cbTotal1 - cashbook2.cbTotal2;
    }

    if (bs1 && bs2) {
      dailyOps.tso = bs1.bs1Total - bs2.bs2Total;
    }

    await dailyOps.save();

    res.json({
      success: true,
      message: 'HO fields updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDailyOperations,
  createOrUpdateDailyOperations,
  submitDailyOperations,
  updateHOFields
};