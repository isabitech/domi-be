// Seeder for fake data for all major models
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import Cashbook1 from '../models/Cashbook1.js';
import Cashbook2 from '../models/Cashbook2.js';
import Cashbook from '../models/Cashbook.js';
import DailyOperations from '../models/DailyOperations.js';
import DisbursementRoll from '../models/DisbursementRoll.js';
import LoanRegister from '../models/LoanRegister.js';
import Prediction from '../models/Prediction.js';
import SavingsRegister from '../models/SavingsRegister.js';
import Settings from '../models/Settings.js';
import BankStatement1 from '../models/BankStatement1.js';
import BankStatement2 from '../models/BankStatement2.js';
import AuditLog from '../models/AuditLog.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/domi';

async function seed() {
  await mongoose.connect(MONGO_URI);

  // Helper to create many docs
  const createMany = async (Model, count, docFn) => {
    await Model.deleteMany({});
    const docs = Array.from({ length: count }, docFn);
    await Model.insertMany(docs);
  };

  // 1. Seed branches
  await Branch.deleteMany({});
  const branches = await Branch.insertMany(Array.from({ length: 3 }, (_, i) => ({
    name: `Branch ${i + 1}`,
    code: `BR${i + 1}`,
    address: { street: faker.location.streetAddress(), city: faker.location.city(), state: faker.location.state(), zipCode: faker.location.zipCode(), country: faker.location.country() },
    phone: faker.phone.number(),
    email: faker.internet.email(),
    status: 'active',
    previousLoanTotal: faker.number.int({ min: 1000, max: 10000 }),
    previousSavingsTotal: faker.number.int({ min: 1000, max: 10000 }),
    previousDisbursement: faker.number.int({ min: 1000, max: 10000 }),
    loanMultiplier: 1 + Math.random(),
    isActive: true
  })));

  // 2. Seed users
  await User.deleteMany({});
  const users = await User.insertMany(Array.from({ length: 5 }, (_, i) => ({
    name: faker.person.fullName(),
    username: faker.internet.username(),
    email: faker.internet.email(),
    password: '$2a$10$abcdefghijklmnopqrstuv', // fake hash
    role: i === 0 ? 'admin' : (i % 2 === 0 ? 'HO' : 'BR'),
    branch: branches[i % branches.length]._id,
    isActive: true,
    status: 'active'
  })));

  // Helper to pick random branch/user
  const pickBranch = () => branches[Math.floor(Math.random() * branches.length)]._id;
  const pickUser = () => users[Math.floor(Math.random() * users.length)]._id;

  // 3. Seed all other models using valid ObjectIds
  await createMany(Cashbook1, 10, () => ({
    branch: pickBranch(),
    user: pickUser(),
    date: faker.date.recent(),
    pcih: faker.number.int({ min: 100, max: 1000 }),
    savings: faker.number.int({ min: 100, max: 1000 }),
    loanCollection: faker.number.int({ min: 100, max: 1000 }),
    chargesCollection: faker.number.int({ min: 10, max: 100 }),
    total: 0,
    frmHO: faker.number.int({ min: 100, max: 1000 }),
    frmBR: faker.number.int({ min: 100, max: 1000 }),
    cbTotal1: 0
  }));

  await createMany(Cashbook2, 10, () => ({
    branch: pickBranch(),
    user: pickUser(),
    date: faker.date.recent(),
    disNo: faker.number.int({ min: 1, max: 10 }),
    disAmt: faker.number.int({ min: 100, max: 1000 }),
    disWithInt: faker.number.int({ min: 100, max: 1000 }),
    savWith: faker.number.int({ min: 100, max: 1000 }),
    domiBank: faker.number.int({ min: 100, max: 1000 }),
    posT: faker.number.int({ min: 100, max: 1000 }),
    cbTotal2: 0
  }));

  await createMany(Cashbook, 10, () => ({
    branch: pickBranch(),
    user: pickUser(),
    date: faker.date.recent(),
    type: faker.helpers.arrayElement(['income', 'expense']),
    category: faker.commerce.department(),
    description: faker.commerce.productDescription(),
    amount: faker.number.int({ min: 100, max: 10000 }),
    paymentMethod: faker.helpers.arrayElement(['cash', 'bank', 'card', 'online']),
    reference: faker.string.uuid(),
    status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
    approvedBy: pickUser(),
    approvedAt: faker.date.recent(),
    notes: faker.lorem.sentence()
  }));

  await createMany(DailyOperations, 10, () => ({
    branch: pickBranch(),
    user: pickUser(),
    date: faker.date.recent(),
    onlineCIH: faker.number.int({ min: 100, max: 1000 }),
    tso: faker.number.int({ min: 100, max: 1000 }),
    isCompleted: faker.datatype.boolean()
  }));

  await createMany(DisbursementRoll, 10, () => ({
    branch: pickBranch(),
    month: faker.date.recent().getMonth() + 1,
    year: faker.date.recent().getFullYear(),
    previousDisbursement: faker.number.int({ min: 1000, max: 10000 }),
    dailyDisbursement: faker.number.int({ min: 1000, max: 10000 }),
    disbursementRoll: 0
  }));

  await createMany(LoanRegister, 10, () => ({
    branch: pickBranch(),
    date: faker.date.recent(),
    previousLoanTotal: faker.number.int({ min: 1000, max: 10000 }),
    loanDisbursementWithInterest: faker.number.int({ min: 100, max: 1000 }),
    loanCollection: faker.number.int({ min: 100, max: 1000 }),
    currentLoanBalance: 0
  }));

  await createMany(Prediction, 10, () => ({
    branch: pickBranch(),
    user: pickUser(),
    date: faker.date.recent(),
    predictionDate: faker.date.future(),
    predictionNo: faker.number.int({ min: 1, max: 10 }),
    predictionAmount: faker.number.int({ min: 100, max: 1000 })
  }));

  await createMany(SavingsRegister, 10, () => ({
    branch: pickBranch(),
    date: faker.date.recent(),
    previousSavingsTotal: faker.number.int({ min: 1000, max: 10000 }),
    savings: faker.number.int({ min: 100, max: 1000 }),
    savingsWithdrawal: faker.number.int({ min: 100, max: 1000 }),
    currentSavings: 0
  }));

  await createMany(Settings, 1, () => ({
    key: 'system',
    value: {
      appName: 'Dominion Ops',
      taxRate: 7.5,
      passwordMinLength: 8,
      emailEnabled: true,
      smsEnabled: false
    }
  }));

  await createMany(BankStatement1, 10, () => ({
    branch: pickBranch(),
    date: faker.date.recent(),
    opening: faker.number.int({ min: 0, max: 1000 }),
    recHO: faker.number.int({ min: 0, max: 1000 }),
    recBO: faker.number.int({ min: 0, max: 1000 }),
    domi: faker.number.int({ min: 0, max: 1000 }),
    pa: faker.number.int({ min: 0, max: 1000 }),
    bs1Total: 0
  }));

  await createMany(BankStatement2, 10, () => ({
    branch: pickBranch(),
    user: pickUser(),
    date: faker.date.recent(),
    withd: faker.number.int({ min: 0, max: 1000 }),
    tbo: faker.number.int({ min: 0, max: 1000 }),
    tboTargetBranch: pickBranch(),
    exAmt: faker.number.int({ min: 0, max: 1000 }),
    exPurpose: faker.lorem.sentence(),
    bs2Total: 0
  }));

  await createMany(AuditLog, 10, () => ({
    userId: pickUser(),
    username: faker.internet.username(),
    action: faker.hacker.verb(),
    resource: faker.hacker.noun(),
    resourceId: faker.string.uuid(),
    oldValue: {},
    newValue: {},
    diff: {},
    meta: {},
    ipAddress: faker.internet.ip(),
    userAgent: faker.internet.userAgent(),
    timestamp: faker.date.recent()
  }));

  console.log('Seeding complete!');
  await mongoose.disconnect();
}
seed().catch(e => { console.error(e); process.exit(1); });
