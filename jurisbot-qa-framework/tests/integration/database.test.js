const mongoose = require('mongoose');

// Mocking User Model to test schema constraints directly
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('TestUser', userSchema);

describe('Database Integrity & Constraints Validation', () => {

  beforeAll(async () => {
    // Connect to an in-memory or dedicated test database
    const mongoUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/jurisbot_test';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  test('Database must block duplicate email registrations', async () => {
    const userData = { email: 'duplicate@test.com', password: 'securepassword123' };

    // Insert first user
    const firstUser = new User(userData);
    await firstUser.save();

    // Attempt to insert duplicate user
    const duplicateUser = new User(userData);
    let error;
    try {
      await duplicateUser.save();
    } catch (err) {
      error = err;
    }

    // Expect a MongoServerError indicating a duplicate key error (code 11000)
    expect(error).toBeDefined();
    expect(error.code).toBe(11000);
  });

  test('Database must enforce required fields', async () => {
    // Missing required email field
    const invalidUser = new User({ password: 'nopassword' });
    let error;
    try {
      await invalidUser.save();
    } catch (err) {
      error = err;
    }

    // Expect a ValidationError
    expect(error).toBeDefined();
    expect(error.name).toBe('ValidationError');
    expect(error.errors.email).toBeDefined();
  });

});
