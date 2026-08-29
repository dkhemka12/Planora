import { connectMongo, disconnectMongo } from '../config/mongo.js';
import { Task } from '../models/Task.js';
import { StudyPlan } from '../models/StudyPlan.js';

/**
 * MongoDB CRUD Test Suite
 * Validates connection and CRUD operations for Task and StudyPlan models.
 */
export async function runMongoTests() {
  console.log('\n========================================');
  console.log('🍃 Starting MongoDB CRUD Test Suite...');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Connect
    console.log('[1/9] Connecting to MongoDB...');
    await connectMongo();
    console.log('✅ Connection established.');
    passed++;

    const testUserId = `test-user-${Date.now()}`;

    // 2. Task CREATE
    console.log('\n[2/9] Testing Task CREATE...');
    const createdTask = await Task.create({
      userId: testUserId,
      title: 'Study Data Structures & Algorithms',
      description: 'Review Binary Search Trees and Graph Traversals',
      subjectId: '101',
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
    });
    console.log(`✅ Task created with ID: ${createdTask._id}`);
    passed++;

    // 3. Task READ
    console.log('\n[3/9] Testing Task READ...');
    const fetchedTask = await Task.findById(createdTask._id);
    if (!fetchedTask || fetchedTask.title !== 'Study Data Structures & Algorithms') {
      throw new Error('Fetched task title does not match created task');
    }
    console.log(`✅ Task successfully fetched: "${fetchedTask.title}" (Priority: ${fetchedTask.priority})`);
    passed++;

    // 4. Task UPDATE
    console.log('\n[4/9] Testing Task UPDATE...');
    const updatedTask = await Task.findByIdAndUpdate(
      createdTask._id,
      { status: 'completed', priority: 'medium' },
      { new: true }
    );
    if (updatedTask.status !== 'completed' || updatedTask.priority !== 'medium') {
      throw new Error('Task update failed to update status/priority');
    }
    console.log(`✅ Task updated status to: "${updatedTask.status}", priority to: "${updatedTask.priority}"`);
    passed++;

    // 5. Task DELETE
    console.log('\n[5/9] Testing Task DELETE...');
    const deletedTask = await Task.findByIdAndDelete(createdTask._id);
    const verifyTaskDeleted = await Task.findById(createdTask._id);
    if (verifyTaskDeleted !== null) {
      throw new Error('Task was not deleted properly');
    }
    console.log(`✅ Task ${deletedTask._id} successfully deleted from MongoDB.`);
    passed++;

    // 6. StudyPlan CREATE
    console.log('\n[6/9] Testing StudyPlan CREATE...');
    const samplePlan = [
      {
        day: 1,
        topic: 'Arrays and Strings',
        duration: 90,
        tasks: ['Read Two Pointer technique', 'Solve 3 LeetCode medium problems'],
      },
      {
        day: 2,
        topic: 'Linked Lists',
        duration: 120,
        tasks: ['Understand fast & slow pointer', 'Reverse linked list', 'Detect cycle'],
      },
    ];

    const createdStudyPlan = await StudyPlan.create({
      userId: testUserId,
      subject: 'Computer Science',
      days: 2,
      plan: samplePlan,
    });
    console.log(`✅ StudyPlan created with ID: ${createdStudyPlan._id} (${createdStudyPlan.plan.length} days)`);
    passed++;

    // 7. StudyPlan READ
    console.log('\n[7/9] Testing StudyPlan READ...');
    const fetchedPlan = await StudyPlan.findById(createdStudyPlan._id);
    if (!fetchedPlan || fetchedPlan.subject !== 'Computer Science' || fetchedPlan.plan.length !== 2) {
      throw new Error('Fetched study plan does not match created study plan');
    }
    console.log(`✅ StudyPlan fetched: Subject "${fetchedPlan.subject}", Day 1 Topic: "${fetchedPlan.plan[0].topic}"`);
    passed++;

    // 8. StudyPlan UPDATE
    console.log('\n[8/9] Testing StudyPlan UPDATE...');
    const updatedPlan = await StudyPlan.findByIdAndUpdate(
      createdStudyPlan._id,
      { subject: 'Advanced Computer Science' },
      { new: true }
    );
    if (updatedPlan.subject !== 'Advanced Computer Science') {
      throw new Error('StudyPlan update failed');
    }
    console.log(`✅ StudyPlan subject updated to: "${updatedPlan.subject}"`);
    passed++;

    // 9. StudyPlan DELETE
    console.log('\n[9/9] Testing StudyPlan DELETE...');
    const deletedPlan = await StudyPlan.findByIdAndDelete(createdStudyPlan._id);
    const verifyPlanDeleted = await StudyPlan.findById(createdStudyPlan._id);
    if (verifyPlanDeleted !== null) {
      throw new Error('StudyPlan was not deleted properly');
    }
    console.log(`✅ StudyPlan ${deletedPlan._id} successfully deleted from MongoDB.`);
    passed++;

    console.log('\n----------------------------------------');
    console.log(`🎉 MongoDB CRUD Test Suite Completed: ${passed} passed, ${failed} failed`);
    console.log('----------------------------------------\n');
    return { success: true, passed, failed };
  } catch (error) {
    console.error(`\n❌ MongoDB Test Failed: ${error.message}`);
    failed++;
    return { success: false, passed, failed, error: error.message };
  } finally {
    await disconnectMongo();
  }
}

// If run directly: node server/scripts/testMongo.js
if (process.argv[1] && process.argv[1].includes('testMongo.js')) {
  runMongoTests().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}
