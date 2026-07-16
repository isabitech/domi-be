import mongoose from 'mongoose';
import Client from '../models/Client.js';
import Branch from '../models/Branch.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const SEARCH_FIELDS = [
  'union',
  'clientName',
  'clientPhone',
  'clientNickName',
  'guarantorName',
  'guarantorPhone',
  'guarantorNickName',
  'partnerReferrerName',
  'partnerReferrerPhone',
  'partnerReferrerNickName'
];

class ClientsService {
  static phonePattern = /^[0-9+\-\s()]{7,20}$/;

  static ensurePhone(value, fieldName, allowNone = false) {
    const normalized = String(value).trim();
    if (allowNone && normalized.toLowerCase() === 'none') {
      return;
    }
    if (!value || !ClientsService.phonePattern.test(String(value).trim())) {
      throw new ValidationError(`${fieldName} has invalid format`);
    }
  }

  static enforceRole(user) {
    if (!user || !['BR', 'HO', 'admin'].includes(user.role)) {
      throw new ForbiddenError('Access denied for clients module');
    }
  }

  static async resolveBranchForCreate(user, branchId) {
    if (user.role === 'BR') {
      return user.branch?._id || user.branch;
    }

    if (!branchId) {
      throw new ValidationError('branchId is required for HO/admin create');
    }

    const exists = await Branch.exists({ _id: branchId });
    if (!exists) throw new NotFoundError('Branch not found');
    return branchId;
  }

  static canAccessClient(user, clientDoc) {
    if (user.role === 'admin' || user.role === 'HO') return true;
    if (user.role === 'BR') {
      const ownBranch = (user.branch?._id || user.branch)?.toString();
      return ownBranch && ownBranch === clientDoc.branch.toString();
    }
    return false;
  }

  static normalizePayload(payload = {}, isPartial = false) {
    const data = {};
    const fields = [
      'union',
      'clientName',
      'clientPhone',
      'clientNickName',
      'guarantorName',
      'guarantorPhone',
      'guarantorNickName',
      'partnerReferrerName',
      'partnerReferrerPhone',
      'partnerReferrerNickName',
      'status'
    ];

    fields.forEach((field) => {
      if (payload[field] !== undefined) {
        if (field === 'partnerReferrerNickName' && payload[field] === null) {
          data[field] = '';
        } else {
          data[field] = typeof payload[field] === 'string' ? payload[field].trim() : payload[field];
        }
      }
    });

    if (!isPartial) {
      const requiredFields = [
        'union',
        'clientName',
        'clientPhone',
        'guarantorName',
        'guarantorPhone',
        'partnerReferrerName',
        'partnerReferrerPhone'
      ];
      requiredFields.forEach((field) => {
        if (!data[field]) {
          throw new ValidationError(`${field} is required`);
        }
      });
    }

    if (data.clientPhone !== undefined) ClientsService.ensurePhone(data.clientPhone, 'clientPhone');
    if (data.guarantorPhone !== undefined) ClientsService.ensurePhone(data.guarantorPhone, 'guarantorPhone');
    if (data.partnerReferrerPhone !== undefined) {
      ClientsService.ensurePhone(data.partnerReferrerPhone, 'partnerReferrerPhone', true);
    }

    if (data.status && !['active', 'inactive'].includes(data.status)) {
      throw new ValidationError('status must be active or inactive');
    }

    return data;
  }

  static listQuery(req) {
    const { branchId, search, status } = req.query;
    const query = {};

    if (req.user.role === 'BR') {
      query.branch = req.user.branch?._id || req.user.branch;
    } else if (branchId) {
      query.branch = branchId;
    }

    if (status) query.status = status;

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = SEARCH_FIELDS.map((field) => ({ [field]: regex }));
    }

    return query;
  }

  static mapClient(clientDoc) {
    const item = clientDoc.toObject ? clientDoc.toObject() : clientDoc;
    return {
      ...item,
      branchId: item.branch?._id || item.branch
    };
  }

  static async list(req) {
    ClientsService.enforceRole(req.user);

    const { page, limit, skip } = parsePagination(req.query);
    const query = ClientsService.listQuery(req);

    const [clients, total] = await Promise.all([
      Client.find(query)
        .populate('branch', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Client.countDocuments(query)
    ]);

    const mapped = clients.map((doc) => ClientsService.mapClient(doc));

    return {
      clients: mapped,
      count: mapped.length,
      total,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  static async create(req) {
    ClientsService.enforceRole(req.user);

    const payload = ClientsService.normalizePayload(req.body, false);
    const branch = await ClientsService.resolveBranchForCreate(req.user, req.body.branchId);

    const client = await Client.create({
      ...payload,
      branch,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    return { client: { _id: client._id } };
  }

  static async update(req) {
    ClientsService.enforceRole(req.user);

    const client = await Client.findById(req.params.id);
    if (!client) throw new NotFoundError('Client not found');

    if (!ClientsService.canAccessClient(req.user, client)) {
      throw new ForbiddenError('Not allowed to update this client');
    }

    const payload = ClientsService.normalizePayload(req.body, true);

    Object.keys(payload).forEach((key) => {
      client[key] = payload[key];
    });

    if ((req.user.role === 'HO' || req.user.role === 'admin') && req.body.branchId) {
      if (!mongoose.isValidObjectId(req.body.branchId)) {
        throw new ValidationError('Invalid branchId');
      }
      const exists = await Branch.exists({ _id: req.body.branchId });
      if (!exists) throw new NotFoundError('Branch not found');
      client.branch = req.body.branchId;
    }

    client.updatedBy = req.user.id;

    await client.save();
    await client.populate('branch', 'name code');

    return { client: ClientsService.mapClient(client) };
  }

  static async delete(req) {
    ClientsService.enforceRole(req.user);

    const client = await Client.findById(req.params.id);
    if (!client) throw new NotFoundError('Client not found');

    if (!ClientsService.canAccessClient(req.user, client)) {
      throw new ForbiddenError('Not allowed to delete this client');
    }

    await Client.deleteOne({ _id: client._id });
  }

  static async summary(req) {
    ClientsService.enforceRole(req.user);

    const match = {};
    if (req.user.role === 'BR') {
      match.branch = req.user.branch?._id || req.user.branch;
    }

    const rows = await Client.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$branch',
          totalClients: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch'
        }
      },
      { $unwind: '$branch' },
      {
        $project: {
          _id: 0,
          branchId: '$_id',
          branchName: '$branch.name',
          branchCode: '$branch.code',
          totalClients: 1
        }
      },
      { $sort: { branchName: 1 } }
    ]);

    const totalClients = rows.reduce((sum, row) => sum + (row.totalClients || 0), 0);

    return {
      totalClients,
      branches: rows
    };
  }
}

export default ClientsService;
