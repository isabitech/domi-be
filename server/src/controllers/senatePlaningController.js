import SenatePlaning from '../models/SenatePlaning.js';
import { senatePlaningSchema } from '../validators/senatePlaningValidator.js';
import { success, failure } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';
// Create senate planning entry
class senatePlaningController {
    // Get all SenatePlaning records filtered by date range (all branches)
   
    static createSenatePlanning = async (req, res) => {
        const { error, value } = senatePlaningSchema.validate(req.body);
        if (error) throw new ValidationError('Validation error', error.details[0].message);
        const planning = new SenatePlaning({
            ...value,
            createdBy: req.user?._id,
            branch: req.user?.branch
        });
        await planning.save();
        return success(res, planning, 'Senate planning created successfully', 201);
    }

    // Get all SenatePlaning records, with optional date filtering
    static getAllSenatePlanning = async (req, res) => {
        const { start, end } = req.query;
        const filter = {};
        if (start || end) {
            filter.createdAt = {};
            if (start) filter.createdAt.$gte = new Date(start);
            if (end) filter.createdAt.$lte = new Date(end);
        }
        const plannings = await SenatePlaning.find(filter).populate('createdBy', 'name email');
        return success(res, plannings, 'All senate planning records fetched');
    }

    // Get all SenatePlaning records for a branch, with optional date filtering
    static getAllForBranch = async (req, res) => {
        const user = req.user;
        const branchId = user?.branch;
        const { start, end } = req.query;
        const filter = { branch: branchId };
        if (start || end) {
            filter.createdAt = {};
            if (start) filter.createdAt.$gte = new Date(start);
            if (end) filter.createdAt.$lte = new Date(end);
        }
        const plannings = await SenatePlaning.find(filter).populate('createdBy', 'name email');
        return success(res, plannings, 'Senate planning records for branch fetched');
    }
    // Get a single SenatePlaning by ID
    static getSenatePlanningById = async (req, res) => {
        const { id } = req.params;
        const planning = await SenatePlaning.findById(id).populate('createdBy', 'name email');
        if (!planning) {
            return failure(res, 'Senate planning not found', 404);
        }
        return success(res, planning, 'Senate planning record fetched');
    }
}
export default new senatePlaningController();
