import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import Prediction from '../models/Prediction.js';
import { ForbiddenError, ValidationError } from '../utils/errors.js';

class PredictionController {
  getPrediction = asyncHandler(async (req, res) => {
    const { date, branchId } = req.query; // date here refers to predictionDate
    const targetDate = date ? new Date(date) : new Date(new Date().getTime() + 24*60*60*1000); // default tomorrow
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const end = new Date(start.getTime() + 24*60*60*1000);
    const branch = req.user.role === 'BR'
      ? (req.user.branch?._id || req.user.branch)
      : (branchId || req.user.branch?._id || req.user.branch);
    if (!branch) {
      throw new ValidationError('branchId is required to fetch prediction');
    }
    const pred = await Prediction.findOne({ branch, predictionDate: { $gte: start, $lt: end } });
    // if (!pred) throw new NotFoundError('Prediction not found');
    success(res, { prediction: pred }, 'Prediction fetched');
  });

  createOrUpdatePrediction = asyncHandler(async (req, res) => {
    if (req.user.role !== 'BR' && req.user.role !== 'admin') {
      throw new ForbiddenError('Only BR users can create prediction');
    }
    const { predictionNo, predictionAmount, predictionDate, branchId } = req.body;
    const targetDate = predictionDate ? new Date(predictionDate) : new Date(new Date().getTime() + 24*60*60*1000);
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const end = new Date(start.getTime() + 24*60*60*1000);
    const branch = req.user.role === 'BR'
      ? (req.user.branch?._id || req.user.branch)
      : (branchId || req.user.branch?._id || req.user.branch);
    if (!branch) {
      throw new ValidationError('branchId is required to save prediction');
    }
    let pred = await Prediction.findOne({ branch, predictionDate: { $gte: start, $lt: end } });
    if (!pred) {
      pred = new Prediction({ branch, user: req.user.id, predictionDate: targetDate });
    }
    pred.branch = branch;
    pred.user = req.user.id;
    pred.predictionDate = targetDate;
    if (predictionNo !== undefined) pred.predictionNo = predictionNo;
    if (predictionAmount !== undefined) pred.predictionAmount = predictionAmount;
    await pred.save();
    success(res, { prediction: pred }, 'Prediction saved');
  });
}

export default new PredictionController();