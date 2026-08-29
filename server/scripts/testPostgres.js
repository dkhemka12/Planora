import { pool, query } from '../config/postgres.js';
import { initPostgres } from '../config/initPostgres.js';
import { UserQueries } from '../models/userQueries.js';
import { SubjectQueries } from '../models/subjectQueries.js';

/**
 * PostgreSQL Schema, Foreign Key, and Relational JOIN Test Suite
 */
export async function runPostgresTests() {
  console.log('\n========================================');
  console.log('🐘 Starting PostgreSQL Test Suite...');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Connection & Schema Init
    console.log('[1/5] Testing PostgreSQL Connection & Schema Initialization...');
    await initPostgres();
    console.log('✅ PostgreSQL Schema initialized (users, subjects tables & indexes).');
    passed++;

    const testEmail = `student_${Date.now()}@planora.dev`;

    // 2. User Creation (Primary Key Test)
    console.log('\n[2/5] Testing User Creation (Primary Key)...');
    const user = await UserQueries.create({
      name: 'Alex Rivera',
      email: testEmail,
      password: '$2a$10$hashedpasswordexampleforphase2verification',
    });
    if (!user || !user.id || user.email !== testEmail) {
      throw new Error('User creation failed or did not return primary key ID');
    }
    console.log(`✅ User created with Primary Key ID: ${user.id} (${user.name}, ${user.email})`);
    passed++;

    // 3. Subject Creation (Foreign Key Constraint Test)
    console.log('\n[3/5] Testing Subject Creation (Foreign Key user_id -> users.id)...');
    const subject1 = await SubjectQueries.create({
      userId: user.id,
      name: 'Operating Systems',
    });
    const subject2 = await SubjectQueries.create({
      userId: user.id,
      name: 'Computer Networks',
    });
    if (!subject1.id || subject1.user_id !== user.id || !subject2.id) {
      throw new Error('Subject creation failed or foreign key mismatch');
    }
    console.log(`✅ Subject 1 created: "${subject1.name}" (ID: ${subject1.id}, FK user_id: ${subject1.user_id})`);
    console.log(`✅ Subject 2 created: "${subject2.name}" (ID: ${subject2.id}, FK user_id: ${subject2.user_id})`);
    passed++;

    // 4. Relational SQL JOIN Query Test
    console.log('\n[4/5] Testing Relational SQL JOIN Query (subjects JOIN users ON subjects.user_id = users.id)...');
    const joinedResults = await SubjectQueries.getSubjectsWithUserDetails(user.id);
    if (!Array.isArray(joinedResults) || joinedResults.length !== 2) {
      throw new Error(`Expected 2 joined rows, got ${joinedResults ? joinedResults.length : 0}`);
    }

    const firstRow = joinedResults[0];
    if (!firstRow.user_name || !firstRow.subject_name || !firstRow.user_email) {
      throw new Error('JOIN query result missing combined relational columns');
    }
    console.log(`✅ Relational JOIN Query succeeded. Retrieved ${joinedResults.length} records:`);
    joinedResults.forEach((row, idx) => {
      console.log(`   [${idx + 1}] Subject: "${row.subject_name}" | Student: "${row.user_name}" (${row.user_email})`);
    });
    passed++;

    // 5. Cleanup Test Record (Testing Cascade Delete FK)
    console.log('\n[5/5] Testing Foreign Key Cascade on User Deletion...');
    await UserQueries.deleteById(user.id);
    const subjectsAfterUserDelete = await SubjectQueries.findByUserId(user.id);
    if (subjectsAfterUserDelete.length !== 0) {
      throw new Error('Cascade delete failed: subjects still remain after user deletion');
    }
    console.log('✅ User deleted and linked subjects automatically cascade-deleted.');
    passed++;

    console.log('\n----------------------------------------');
    console.log(`🎉 PostgreSQL Test Suite Completed: ${passed} passed, ${failed} failed`);
    console.log('----------------------------------------\n');
    return { success: true, passed, failed };
  } catch (error) {
    console.error(`\n❌ PostgreSQL Test Encountered: ${error.message}`);
    failed++;
    return { success: false, passed, failed, error: error.message };
  } finally {
    try {
      await pool.end();
    } catch {
      // ignore pool end error
    }
  }
}

// If run directly: node server/scripts/testPostgres.js
if (process.argv[1] && process.argv[1].includes('testPostgres.js')) {
  runPostgresTests().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}
