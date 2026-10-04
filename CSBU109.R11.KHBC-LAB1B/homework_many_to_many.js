require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/course_registration_db';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
});

const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  maxStudents: { type: Number, required: true },
  availableSlots: { type: Number, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
});

const Student = mongoose.model('Student', studentSchema);
const Course = mongoose.model('Course', courseSchema);

async function enrollCourse(studentId, courseId) {
  try {
    const student = await Student.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !course) {
      console.log('Student or Course not found.');
      return;
    }

    const isAlreadyEnrolled = student.courses.includes(courseId);
    if (isAlreadyEnrolled) {
      console.log(`Student ${student.name} is already enrolled in ${course.title}.`);
      return;
    }

    if (course.availableSlots <= 0) {
      console.log(`Course ${course.title} has no available slots.`);
      return;
    }

    student.courses.push(courseId);
    await student.save();

    course.students.push(studentId);
    course.availableSlots -= 1;
    await course.save();

    console.log(`Successfully enrolled ${student.name} in ${course.title}.`);
  } catch (error) {
    console.error('Error enrolling in course:', error.message);
  }
}

async function dropCourse(studentId, courseId) {
  try {
    const student = await Student.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !course) {
      console.log('Student or Course not found.');
      return;
    }

    const isEnrolled = student.courses.includes(courseId);
    if (!isEnrolled) {
      console.log(`Student ${student.name} is not enrolled in ${course.title}.`);
      return;
    }

    student.courses = student.courses.filter(
      (id) => id.toString() !== courseId.toString()
    );
    await student.save();

    course.students = course.students.filter(
      (id) => id.toString() !== studentId.toString()
    );
    course.availableSlots += 1;
    await course.save();

    console.log(`Successfully dropped ${course.title} for ${student.name}.`);
  } catch (error) {
    console.error('Error dropping course:', error.message);
  }
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI);

    await Student.deleteMany({});
    await Course.deleteMany({});

    const student1 = await Student.create({
      name: 'Nguyen Van Hung',
      email: 'hung.nguyen@example.com'
    });

    const student2 = await Student.create({
      name: 'Tran Thi Mai',
      email: 'mai.tran@example.com'
    });

    const course1 = await Course.create({
      courseCode: 'CS101',
      title: 'Database Systems',
      maxStudents: 1,
      availableSlots: 1
    });

    console.log('--- Test 1: Enroll Student 1 ---');
    await enrollCourse(student1._id, course1._id);

    console.log('--- Test 2: Try duplicate enrollment ---');
    await enrollCourse(student1._id, course1._id);

    console.log('--- Test 3: Try enrolling when full ---');
    await enrollCourse(student2._id, course1._id);

    console.log('--- Test 4: Drop Course ---');
    await dropCourse(student1._id, course1._id);

    console.log('--- Test 5: Enroll Student 2 after slot is available ---');
    await enrollCourse(student2._id, course1._id);

    const populatedStudent = await Student.findById(student2._id).populate('courses');
    console.log('Updated Student Data:', JSON.stringify(populatedStudent, null, 2));
  } catch (error) {
    console.error('Database execution error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

main();