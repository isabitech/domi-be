import SenatePlaning from '../models/SenatePlaning.js';
import { senatePlaningSchema } from '../validators/senatePlaningValidator.js';
import { success, failure } from '../utils/response.js';
import { ValidationError } from 'src/utils/errors.js';
// Create senate planning entry
class senatePlaningController {
    static createSenatePlanning = async (req, res) => {
        const { error, value } = senatePlaningSchema.validate(req.body);
        if (error) throw new ValidationError('Validation error', error.details[0].message);
        const planning = new SenatePlaning({
            ...value,
            createdBy: req.user?._id
        });
        await planning.save();
        return success(res, planning, 'Senate planning created successfully', 201);

    }
}
export default new senatePlaningController();
