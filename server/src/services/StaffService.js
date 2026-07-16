import Staff from '../models/Staff.js';
import Branch from '../models/Branch.js';
import { DuplicateError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const SEARCH_FIELDS = [
  'staffName',
  'staffIdNumber',
  'currentPosition',
  'currentBranch',
  'residentialAddress',
  'guarantorName',
  'guarantorNumber'
];

class StaffService {
  static phonePattern = /^[0-9+\-\s()]{7,20}$/;

  static ensureHO(user) {
    if (!user || !['HO', 'admin'].includes(user.role)) {
      throw new ForbiddenError('Access denied: Head Office users only');
    }
  }

  static ensurePhone(value, fieldName) {
    if (!value || !StaffService.phonePattern.test(String(value).trim())) {
      throw new ValidationError(`${fieldName} has invalid format`);
    }
  }

  static normalizePayload(payload = {}, isPartial = false) {
    const fields = [
      'staffName',
      'staffIdNumber',
      'employmentDate',
      'currentPosition',
      'currentBranch',
      'branchId',
      'residentialAddress',
      'guarantorName',
      'guarantorNumber',
      'gender'
    ];

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

    if (data.guarantorNumber !== undefined) {
      StaffService.ensurePhone(data.guarantorNumber, 'guarantorNumber');
    }

    if (data.employmentDate !== undefined) {
      const parsed = new Date(data.employmentDate);
      if (Number.isNaN(parsed.getTime())) {
        throw new ValidationError('employmentDate must be a valid date');
      }
      data.employmentDate = parsed;
    }

    return data;
  }

  static mapStaff(staffDoc) {
    const item = staffDoc.toObject ? staffDoc.toObject() : staffDoc;
    return {
      ...item,
      branchId: item.branch?._id || item.branch
    };
  }

  static async list(req) {
    StaffService.ensureHO(req.user);

    const { page, limit, skip } = parsePagination(req.query);
    const { branchId, search, gender } = req.query;

    const query = {};
    if (branchId) query.branch = branchId;
    if (gender) query.gender = gender;

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = SEARCH_FIELDS.map((field) => ({ [field]: regex }));
    }

    const [staff, total] = await Promise.all([
      Staff.find(query)
        .populate('branch', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Staff.countDocuments(query)
    ]);

    const mapped = staff.map((doc) => StaffService.mapStaff(doc));

    return {
      staff: mapped,
      count: mapped.length,
      total,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  static async create(req) {
    StaffService.ensureHO(req.user);

    const payload = StaffService.normalizePayload(req.body, false);

    const branchExists = await Branch.exists({ _id: payload.branchId });
    if (!branchExists) throw new NotFoundError('Branch not found');

    const duplicate = await Staff.findOne({ staffIdNumber: payload.staffIdNumber });
    if (duplicate) throw new DuplicateError('staffIdNumber already exists');

    const created = await Staff.create({
      staffName: payload.staffName,
      staffIdNumber: payload.staffIdNumber,
      employmentDate: payload.employmentDate,
      currentPosition: payload.currentPosition,
      currentBranch: payload.currentBranch,
      branch: payload.branchId,
      residentialAddress: payload.residentialAddress,
      guarantorName: payload.guarantorName,
      guarantorNumber: payload.guarantorNumber,
      gender: payload.gender,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    return { staff: { _id: created._id } };
  }

  static async update(req) {
    StaffService.ensureHO(req.user);

    const staff = await Staff.findById(req.params.id);
    if (!staff) throw new NotFoundError('Staff record not found');

    const payload = StaffService.normalizePayload(req.body, true);

    if (payload.staffIdNumber && payload.staffIdNumber !== staff.staffIdNumber) {
      const duplicate = await Staff.findOne({ staffIdNumber: payload.staffIdNumber, _id: { $ne: staff._id } });
      if (duplicate) throw new DuplicateError('staffIdNumber already exists');
    }

    if (payload.branchId) {
      const branchExists = await Branch.exists({ _id: payload.branchId });
      if (!branchExists) throw new NotFoundError('Branch not found');
      staff.branch = payload.branchId;
    }

    if (payload.staffName !== undefined) staff.staffName = payload.staffName;
    if (payload.staffIdNumber !== undefined) staff.staffIdNumber = payload.staffIdNumber;
    if (payload.employmentDate !== undefined) staff.employmentDate = payload.employmentDate;
    if (payload.currentPosition !== undefined) staff.currentPosition = payload.currentPosition;
    if (payload.currentBranch !== undefined) staff.currentBranch = payload.currentBranch;
    if (payload.residentialAddress !== undefined) staff.residentialAddress = payload.residentialAddress;
    if (payload.guarantorName !== undefined) staff.guarantorName = payload.guarantorName;
    if (payload.guarantorNumber !== undefined) staff.guarantorNumber = payload.guarantorNumber;
    if (payload.gender !== undefined) staff.gender = payload.gender;

    staff.updatedBy = req.user.id;
    await staff.save();
    await staff.populate('branch', 'name code');

    return { staff: StaffService.mapStaff(staff) };
  }

  static async delete(req) {
    StaffService.ensureHO(req.user);

    const staff = await Staff.findById(req.params.id);
    if (!staff) throw new NotFoundError('Staff record not found');

    await Staff.deleteOne({ _id: staff._id });
  }
}

export default StaffService;
