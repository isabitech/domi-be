import Investor from '../models/Investor.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const SEARCH_FIELDS = ['investorName', 'phone', 'status'];

class InvestorsService {
  static phonePattern = /^[0-9+\-\s()]{7,20}$/;

  static ensureHO(user) {
    if (!user || !['HO', 'admin'].includes(user.role)) {
      throw new ForbiddenError('Access denied: Head Office users only');
    }
  }

  static ensurePhone(value) {
    if (!value || !InvestorsService.phonePattern.test(String(value).trim())) {
      throw new ValidationError('phone has invalid format');
    }
  }

  static normalizePayload(payload = {}, isPartial = false) {
    const fields = ['investorName', 'gender', 'phone', 'rioDate', 'status'];
    const data = {};

    fields.forEach((field) => {
      if (payload[field] !== undefined) {
        data[field] = typeof payload[field] === 'string' ? payload[field].trim() : payload[field];
      }
    });

    if (!isPartial) {
      fields.forEach((field) => {
        if (!data[field]) {
          throw new ValidationError(`${field} is required`);
        }
      });
    }

    if (data.gender && !['male', 'female'].includes(data.gender)) {
      throw new ValidationError('gender must be male or female');
    }

    if (data.status && !['paid', 'update', 'withdrawal'].includes(data.status)) {
      throw new ValidationError('status must be paid, update, or withdrawal');
    }

    if (data.phone !== undefined) {
      InvestorsService.ensurePhone(data.phone);
    }

    if (data.rioDate !== undefined) {
      const parsed = new Date(data.rioDate);
      if (Number.isNaN(parsed.getTime())) {
        throw new ValidationError('rioDate must be a valid date');
      }
      data.rioDate = parsed;
    }

    return data;
  }

  static mapInvestor(investorDoc) {
    const item = investorDoc.toObject ? investorDoc.toObject() : investorDoc;
    return {
      ...item,
      rioDate: item.rioDate ? new Date(item.rioDate).toISOString().slice(0, 10) : null
    };
  }

  static async list(req) {
    InvestorsService.ensureHO(req.user);

    const { page, limit, skip } = parsePagination(req.query);
    const { search, gender, status } = req.query;

    const query = {};
    if (gender) query.gender = gender;
    if (status) query.status = status;

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = SEARCH_FIELDS.map((field) => ({ [field]: regex }));
    }

    const [investors, total] = await Promise.all([
      Investor.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Investor.countDocuments(query)
    ]);

    const mapped = investors.map((doc) => InvestorsService.mapInvestor(doc));

    return {
      investors: mapped,
      count: mapped.length,
      total,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  static async create(req) {
    InvestorsService.ensureHO(req.user);

    const payload = InvestorsService.normalizePayload(req.body, false);

    const investor = await Investor.create({
      ...payload,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    return { investor: { _id: investor._id } };
  }

  static async update(req) {
    InvestorsService.ensureHO(req.user);

    const investor = await Investor.findById(req.params.id);
    if (!investor) throw new NotFoundError('Investor record not found');

    const payload = InvestorsService.normalizePayload(req.body, true);

    if (payload.investorName !== undefined) investor.investorName = payload.investorName;
    if (payload.gender !== undefined) investor.gender = payload.gender;
    if (payload.phone !== undefined) investor.phone = payload.phone;
    if (payload.rioDate !== undefined) investor.rioDate = payload.rioDate;
    if (payload.status !== undefined) investor.status = payload.status;

    investor.updatedBy = req.user.id;
    await investor.save();

    return { investor: InvestorsService.mapInvestor(investor) };
  }

  static async delete(req) {
    InvestorsService.ensureHO(req.user);

    const investor = await Investor.findById(req.params.id);
    if (!investor) throw new NotFoundError('Investor record not found');

    await Investor.deleteOne({ _id: investor._id });
  }
}

export default InvestorsService;