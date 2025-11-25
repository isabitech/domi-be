import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import sendEmail from '../utils/sendEmail.js';
import { AuthError, DuplicateError, NotFoundError, ValidationError } from '../utils/errors.js';
import RevokedToken from '../models/RevokedToken.js';
import { listPermissions } from '../utils/permissions.js';
import { logAudit, AUDIT_ACTIONS } from '../utils/audit.js';

class AuthService {

    generateToken(id) {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "30d"
        });
    }

    async register(data, req) {
        const { name, email, password, role, branch } = data;

        const exists = await User.findOne({ email });
        if (exists) throw new DuplicateError('User already exists');

        const user = await User.create({
            name,
            email,
            password,
            role: role || "employee",
            branch
        });

        const token = this.generateToken(user._id);

        const payload = {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                branch: user.branch
            }
        };
        // Audit registration
        logAudit({
            user,
            action: AUDIT_ACTIONS.CREATE,
            resource: 'auth',
            resourceId: user._id.toString(),
            oldDoc: null,
            newDoc: { id: user._id.toString(), email: user.email, role: user.role },
            req,
            extra: { event: 'register', branchId: user.branch?.toString() }
        });
        return payload;
    }

    async login(data, req) {
        const { email, username, password } = this.validateLoginInput(data);
        // allow login by email OR username
        const identifier = email || username || data.email || data.username;
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] }).select('+password').populate('branch');
        if (!user || !user.isActive) throw new AuthError('Invalid credentials');
        await this.verifyPassword(user, password);

        // generate token and compute expiresIn seconds
        const token = this.generateToken(user._id);
        const decoded = jwt.decode(token) || {};
        const expiresIn = decoded.exp && decoded.iat ? decoded.exp - decoded.iat : undefined;

        // update lastLogin / isFirstLogin
        const wasFirst = !!user.isFirstLogin;
        user.lastLogin = new Date();
        if (user.isFirstLogin) user.isFirstLogin = false;
        await user.save();

        await this.notifyHeadOfficeOnBranchLogin(user);
        const response = this.buildAuthResponse(user, token, expiresIn);
        logAudit({
            user,
            action: AUDIT_ACTIONS.LOGIN,
            resource: 'auth',
            resourceId: user._id.toString(),
            oldDoc: null,
            newDoc: { userId: user._id.toString(), success: true },
            req,
            extra: { event: 'login', branchId: user.branch?._id?.toString(), branchCode: user.branch?.code }
        });
        return response;
    }

    // Helper: Validate login input (accepts email OR username)
    validateLoginInput(data) {
        const { email, username, password } = data;
        if ((!email && !username) || !password) throw new ValidationError('Email/username and password are required');
        return { email, username, password };
    }

    // Helper: Find active user by email
    async findActiveUserByEmail(email) {
        const user = await User.findOne({ email })
            .select('+password')
            .populate('branch');
        if (!user || !user.isActive) throw new AuthError('Invalid credentials');
        return user;
    }

    // Helper: Verify password
    async verifyPassword(user, password) {
        const isMatch = await user.comparePassword(password);
        if (!isMatch) throw new AuthError('Invalid credentials');
    }

    // Helper: Notify HO on branch login (silent failure)
    async notifyHeadOfficeOnBranchLogin(user) {
        if (user.role !== 'BR') return;
        try {
            const hoUsers = await User.find({ role: 'HO', isActive: true });
            const branch = await Branch.findById(user.branch);
            for (const ho of hoUsers) {
                await sendEmail({
                    email: ho.email,
                    subject: 'Branch Login Notification',
                    message: `Branch ${branch?.name || 'Unknown'} (${user.name}) logged in at ${new Date().toLocaleString()}`
                });
            }
        } catch (e) {
            console.log('Email failed:', e.message);
        }
    }

    // Helper: Build auth response
    buildAuthResponse(user, token, expiresIn) {
        // const perms = listPermissions(user.role);
        return {
            token,
            expiresIn,
            user: {
                id: user._id,
                username: user.username || user.name,
                email: user.email,
                role: user.role,
                branchId: user.branch?._id || null,
                branchName: user.branch?.name || null,
                // permissions: perms,
                lastLogin: user.lastLogin || null,
                isFirstLogin: !!user.isFirstLogin
            }
        };
    }

    async getMe(id) {
        const user = await User.findById(id).populate("branch");
        const perms = listPermissions(user.role);
        return {
            id: user._id,
            username: user.username || user.name,
            email: user.email,
            role: user.role,
            branchId: user.branch?._id || null,
            branchName: user.branch?.name || null,
            permissions: perms,
            lastLogin: user.lastLogin || null,
            isFirstLogin: !!user.isFirstLogin
        };
    }

    async forgotPassword(email, reqUser, req) {
        const user = await User.findOne({ email });
        if (!user) throw new NotFoundError('User not found');

        const resetToken = crypto.randomBytes(20).toString("hex");

        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        await sendEmail({
            email: user.email,
            subject: "Password reset token",
            message: `Reset your password by sending a PUT request to: ${resetUrl}`
        });
        logAudit({
            user: reqUser || user,
            action: AUDIT_ACTIONS.UPDATE,
            resource: 'auth',
            resourceId: user._id.toString(),
            oldDoc: null,
            newDoc: { passwordResetRequested: true },
            req,
            extra: { event: 'forgot_password' }
        });
        return { message: "Reset email sent" };
    }

    async resetPassword(token, password, reqUser, req) {
        const hashed = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashed,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) throw new AuthError('Invalid token');

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        const jwtToken = this.generateToken(user._id);
        logAudit({
            user: reqUser || user,
            action: AUDIT_ACTIONS.UPDATE,
            resource: 'auth',
            resourceId: user._id.toString(),
            oldDoc: null,
            newDoc: { passwordReset: true },
            req,
            extra: { event: 'reset_password' }
        });
        return { token: jwtToken };
    }

    async revokeToken(rawToken, reqUser, req) {
        if (!rawToken) return;
        // decode expiry without verifying signature
        const decoded = jwt.decode(rawToken);
        const expiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        try {
            await RevokedToken.create({ tokenHash, expiresAt });
        } catch (err) {
            // ignore duplicate key or write errors
        }
        if (reqUser) {
            logAudit({
                user: reqUser,
                action: AUDIT_ACTIONS.LOGOUT,
                resource: 'auth',
                resourceId: reqUser._id?.toString() || reqUser.id?.toString(),
                oldDoc: null,
                newDoc: { logout: true },
                req,
                extra: { event: 'logout' }
            });
        }
    }
}

export default new AuthService();