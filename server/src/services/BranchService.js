import User from "../models/User";
import Branch from "../models/Branch.js";

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

    async createBranch(data) {
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
        return branch;
    }

    async updateBranch(id, data) {
        const { name, code, address, phone, email, manager } = data;

        const branch = await Branch.findById(id);
        if (!branch) throw new Error("Branch not found");

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

        return updated;
    }

    async deleteBranch(id) {
        const branch = await Branch.findById(id);
        if (!branch) throw new Error("Branch not found");

        const usersCount = await User.countDocuments({ branch: id });
        if (usersCount > 0) {
            throw new Error("Cannot delete branch with associated users");
        }

        await Branch.findByIdAndDelete(id);
        return "Branch deleted successfully";
    }

    async toggleStatus(id) {
        const branch = await Branch.findById(id);
        if (!branch) throw new Error("Branch not found");

        branch.isActive = !branch.isActive;
        await branch.save();

        return {
            status: branch.isActive,
            message: `Branch ${branch.isActive ? "activated" : "deactivated"} successfully`,
            data: branch
        };
    }
}

export default new BranchService();
