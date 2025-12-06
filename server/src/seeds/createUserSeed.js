import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const argv = process.argv.slice(2);
const parseArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const found = argv.find(a => a.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  return process.env[`SEED_${name.toUpperCase()}`] || fallback;
};

const username = parseArg('username', 'admin');
const email = parseArg('email', 'admin@example.com');
const password = parseArg('password', 'Password123!');
const role = parseArg('role', 'admin');
const branch = parseArg('branch', null);

const run = async () => {
  try {
    await connectDB();

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      console.log('User already exists:', exists._id.toString());
      process.exit(0);
    }

    const user = await User.create({
      name: username,
      username,
      email,
      password,
      role,
      branch: branch || undefined
    });

    console.log('Seed user created:');
    console.log({ id: user._id.toString(), email: user.email, username: user.username, role: user.role });
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
  }
};

run();
