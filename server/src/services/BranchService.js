import mongoose from 'mongoose';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import { logAudit, AUDIT_ACTIONS } from '../utils/audit.js';
import { DuplicateError, NotFoundError, ValidationError } from '../utils/errors.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

class BranchService {
    async listBranches(query = {}) {
        const { page, limit, skip } = parsePagination(query);
        const searchFilter = query.search
            ? {
                    $or: [
                        { name: { $regex: query.search, $options: 'i' } },
                        { code: { $regex: query.search, $options: 'i' } }
                    ]
                }
            : {};

        const branches = await Branch.find(searchFilter)
            .populate('manager', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ name: 1 });

        const total = await Branch.countDocuments(searchFilter);

        return {
            count: branches.length,
            total,
            pagination: buildPaginationMeta(total, page, limit),
            branches
        };
    }

    async getBranchById(id) {
        const branch = await Branch.findById(id).populate('manager', 'name email');
        if (!branch) throw new NotFoundError('Branch not found');
        return branch;
    }

    async ensureBranchUniqueness(name, code, excludeId) {
        const filters = [];
        if (name) filters.push({ name: name.trim() });
        if (code) filters.push({ code: code.trim() });
        if (!filters.length) return;
        const query = { $or: filters };
        if (excludeId) query._id = { $ne: excludeId };
        const conflict = await Branch.findOne(query);
        if (conflict) throw new DuplicateError('Branch with this name or code already exists');
    }

    async ensureManagerUniqueness(email, username) {
        const checks = [{ email: email.toLowerCase() }];
        if (username) checks.push({ username });
        const conflict = await User.findOne({ $or: checks });
        if (conflict) throw new DuplicateError('Manager user with this email or username already exists');
    }

    formatAddress(address) {
        if (!address) return undefined;
        if (typeof address === 'string') return { street: address };
        return address;
    }

    async createBranch(payload, actor, reqMeta) {
        const {
            name,
            code,
            address,
            phone,
            email,
            managerName,
            managerUsername,
            managerEmail,
            managerPassword,
            operationHours,
            dailyLimit,
            previousLoanTotal = 0,
            previousSavingsTotal = 0,
            previousDisbursement = 0
        } = payload;

        await this.ensureBranchUniqueness(name, code);

        const usernameCandidate = (managerUsername || managerEmail?.split('@')[0] || '').trim() || undefined;
        await this.ensureManagerUniqueness(managerEmail, usernameCandidate);

        const session = await mongoose.startSession();
        let branch;

        await session
            .withTransaction(async () => {
                const [managerUser] = await User.create(
                    [
                        {
                            name: managerName.trim(),
                            username: usernameCandidate,
                            email: managerEmail.toLowerCase(),
                            password: managerPassword,
                            role: 'BR'
                        }
                    ],
                    { session }
                );

                const [createdBranch] = await Branch.create(
                    [
                        {
                            name: name.trim(),
                            code: code.trim(),
                            address: this.formatAddress(address),
                            phone,
                            email,
                            manager: managerUser._id,
                            managerEmail,
                            managerPassword,
                            operationHours,
                            dailyLimit,
                            previousLoanTotal,
                            previousSavingsTotal,
                            previousDisbursement
                        }
                    ],
                    { session }
                );

                await User.updateOne({ _id: managerUser._id }, { branch: createdBranch._id }, { session });
                branch = createdBranch;
            })
            .finally(() => session.endSession());

        await branch.populate('manager', 'name email');
        const sanitizedBranch = branch.toObject();
        delete sanitizedBranch.managerPassword;
        logAudit({
            user: actor,
            action: AUDIT_ACTIONS.CREATE,
            resource: 'branch',
            resourceId: branch._id.toString(),
            oldDoc: null,
            newDoc: sanitizedBranch,
            req: reqMeta,
            extra: { branchId: branch._id.toString(), branchCode: branch.code }
        });
        return sanitizedBranch;
    }

    async updateBranch(id, payload, actor, reqMeta) {
        const { name, code, address, phone, email, manager } = payload;

        const branch = await Branch.findById(id);
        if (!branch) throw new NotFoundError('Branch not found');
        const oldSnapshot = branch.toObject();

        await this.ensureBranchUniqueness(name, code, id);

        if (manager) {
            const managerUser = await User.findById(manager);
            if (!managerUser) throw new ValidationError('Manager user not found');
        }

        if (name) branch.name = name.trim();
        if (code) branch.code = code.trim();
        if (address !== undefined) branch.address = this.formatAddress(address);
        if (phone !== undefined) branch.phone = phone;
        if (email !== undefined) branch.email = email;
        if (manager !== undefined) branch.manager = manager;

        await branch.save();
        await branch.populate('manager', 'name email');

        logAudit({
            user: actor,
            action: AUDIT_ACTIONS.UPDATE,
            resource: 'branch',
            resourceId: branch._id.toString(),
            oldDoc: oldSnapshot,
            newDoc: branch.toObject(),
            req: reqMeta,
            extra: { branchId: branch._id.toString(), branchCode: branch.code }
        });

        return branch;
    }

    async deleteBranch(id, actor, reqMeta) {
        const branch = await Branch.findById(id);
        if (!branch) throw new NotFoundError('Branch not found');
        const oldSnapshot = branch.toObject();

        // Detach users from this branch by nulling their branch reference
        // await User.updateMany({ branch: id }, { $set: { branch: null } });
        await User.deleteMany({ branch: id });

        await Branch.findByIdAndDelete(id);
        logAudit({
            user: actor,
            action: AUDIT_ACTIONS.DELETE,
            resource: 'branch',
            resourceId: branch._id.toString(),
            oldDoc: oldSnapshot,
            newDoc: null,
            req: reqMeta,
            extra: { branchId: branch._id.toString(), branchCode: branch.code }
        });
    }

    async toggleStatus(id, actor, reqMeta) {
        const branch = await Branch.findById(id);
        if (!branch) throw new NotFoundError('Branch not found');
        const oldSnapshot = branch.toObject();

        branch.isActive = !branch.isActive;
        await branch.save();

        logAudit({
            user: actor,
            action: AUDIT_ACTIONS.STATUS,
            resource: 'branch',
            resourceId: branch._id.toString(),
            oldDoc: oldSnapshot,
            newDoc: branch.toObject(),
            req: reqMeta,
            extra: { branchId: branch._id.toString(), branchCode: branch.code, status: branch.isActive }
        });

        return branch;
    }
}

export default new BranchService();
