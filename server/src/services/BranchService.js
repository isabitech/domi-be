import User from "../models/User";
import Branch from "../models/Branch.js";
import { logAudit, AUDIT_ACTIONS } from '../utils/audit.js';

class BranchService {
    async getBranches({ page, limit, search }) {
        const p = parseInt(page) || 1;
        const l = parseInt(limit) || 10;
        const skip = (p - 1) * l;

        const query = search
            ? {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { code: { $regex: search, $options: "i" } }
                ]
            }
            : {};

        const branches = await Branch.find(query)
            .populate("manager", "name email")
            .skip(skip)
            .limit(l)
            .sort({ name: 1 });

        const total = await Branch.countDocuments(query);

        return {
            count: branches.length,
            total,
            pagination: {
                page: p,
                limit: l,
                pages: Math.ceil(total / l)
            },
            data: branches
        };
    }
    async getBranch(id) {
        const branch = await Branch.findById(id).populate("manager", "name email");
        if (!branch) throw new Error("Branch not found");
        return branch;
    }
    async createBranch(data, reqUser, req) {
        const { name, code, address, phone, email, manager } = data;

        const exists = await Branch.findOne({
            $or: [{ name }, { code }]
        });

        if (exists) throw new Error("Branch with this name or code already exists");

        if (manager) {
            const managerUser = await User.findById(manager);
            if (!managerUser) throw new Error("Manager user not found");
        }

        const branch = await Branch.create({
            name,
            code,
            address,
            phone,
            email,
            manager
        });

        await branch.populate("manager", "name email");
        logAudit({
            user: reqUser,
            action: AUDIT_ACTIONS.CREATE,
            resource: 'branch',
            resourceId: branch._id.toString(),
            oldDoc: null,
            newDoc: branch.toObject(),
            req,
            extra: { branchId: branch._id.toString(), branchCode: branch.code }
        });
        return branch;
    }
    async updateBranch(id, data, reqUser, req) {
        const { name, code, address, phone, email, manager } = data;

        const branch = await Branch.findById(id);
        if (!branch) throw new Error("Branch not found");
        const oldSnapshot = branch.toObject();

        if (name || code) {
            const duplicate = await Branch.findOne({
                _id: { $ne: id },
                $or: [
                    ...(name ? [{ name }] : []),
                    ...(code ? [{ code }] : [])
                ]
            });

            if (duplicate) {
                throw new Error("Branch with this name or code already exists");
            }
        }

        if (manager) {
            const managerUser = await User.findById(manager);
            if (!managerUser) throw new Error("Manager user not found");
        }

        const updated = await Branch.findByIdAndUpdate(
            id,
            { name, code, address, phone, email, manager },
            { new: true, runValidators: true }
        ).populate("manager", "name email");

        logAudit({
            user: reqUser,
            action: AUDIT_ACTIONS.UPDATE,
            resource: 'branch',
            resourceId: updated._id.toString(),
            oldDoc: oldSnapshot,
            newDoc: updated.toObject(),
            req,
            extra: { branchId: updated._id.toString(), branchCode: updated.code }
        });

        return updated;
    }
    async deleteBranch(id, reqUser, req) {
        const branch = await Branch.findById(id);
        if (!branch) throw new Error("Branch not found");
        const oldSnapshot = branch.toObject();

        const usersCount = await User.countDocuments({ branch: id });
        if (usersCount > 0) {
            throw new Error("Cannot delete branch with associated users");
        }

        await Branch.findByIdAndDelete(id);
        logAudit({
            user: reqUser,
            action: AUDIT_ACTIONS.DELETE,
            resource: 'branch',
            resourceId: branch._id.toString(),
            oldDoc: oldSnapshot,
            newDoc: null,
            req,
            extra: { branchId: branch._id.toString(), branchCode: branch.code }
        });
        return "Branch deleted successfully";
    }
    async toggleStatus(id, reqUser, req) {
        const branch = await Branch.findById(id);
        if (!branch) throw new Error("Branch not found");
        const oldSnapshot = branch.toObject();

        branch.isActive = !branch.isActive;
        await branch.save();

        const out = {
            status: branch.isActive,
            message: `Branch ${branch.isActive ? "activated" : "deactivated"} successfully`,
            data: branch
        };
        logAudit({
            user: reqUser,
            action: AUDIT_ACTIONS.STATUS,
            resource: 'branch',
            resourceId: branch._id.toString(),
            oldDoc: oldSnapshot,
            newDoc: branch.toObject(),
            req,
            extra: { branchId: branch._id.toString(), branchCode: branch.code, status: branch.isActive }
        });
        return out;
    }
}

export default new BranchService();
