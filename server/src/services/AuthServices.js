import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import sendEmail from '../utils/sendEmail.js';
import { AuthError, DuplicateError, NotFoundError, ValidationError } from '../utils/errors.js';

class AuthService {

    generateToken(id) {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "30d"
        });
    }

    async register(data) {
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

        return {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                branch: user.branch
            }
        };
    }

    async login(data) {
        const { email, password } = this.validateLoginInput(data);
        const user = await this.findActiveUserByEmail(email);
        await this.verifyPassword(user, password);
        const token = this.generateToken(user._id);
        await this.notifyHeadOfficeOnBranchLogin(user);
        return this.buildAuthResponse(user, token);
    }

    // Helper: Validate login input
    validateLoginInput(data) {
        const { email, password } = data;
        if (!email || !password) throw new ValidationError('Email and password are required');
        return { email, password };
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
    buildAuthResponse(user, token) {
        return {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                branch: user.branch
            }
        };
    }

    async getMe(id) {
        const user = await User.findById(id).populate("branch");

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            branch: user.branch
        };
    }

    async forgotPassword(email) {
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

        return { message: "Reset email sent" };
    }

    async resetPassword(token, password) {
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

        return { token: jwtToken };
    }
}

export default new AuthService();
