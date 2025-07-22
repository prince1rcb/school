const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      Subject.deleteMany({}),
      Announcement.deleteMany({}),
      Event.deleteMany({})
    ]);
    console.log('✅ Cleared existing data');

    // Create Subjects
    const subjects = await Subject.insertMany([
      {
        name: 'Mathematics',
        code: 'MATH',
        category: 'mathematics',
        grades: [6, 7, 8, 9, 10, 11, 12],
        maxMarks: 100,
        passMarks: 33
      },
      {
        name: 'Science',
        code: 'SCI',
        category: 'science',
        grades: [6, 7, 8],
        maxMarks: 100,
        passMarks: 33
      },
      {
        name: 'Physics',
        code: 'PHY',
        category: 'science',
        grades: [9, 10, 11, 12],
        maxMarks: 100,
        passMarks: 33
      },
      {
        name: 'Chemistry',
        code: 'CHE',
        category: 'science',
        grades: [9, 10, 11, 12],
        maxMarks: 100,
        passMarks: 33
      },
      {
        name: 'Biology',
        code: 'BIO',
        category: 'science',
        grades: [9, 10, 11, 12],
        maxMarks: 100,
        passMarks: 33
      },
      {
        name: 'English',
        code: 'ENG',
        category: 'language',
        grades: [6, 7, 8, 9, 10, 11, 12],
        maxMarks: 100,
        passMarks: 33
      },
      {
        name: 'Hindi',
        code: 'HIN',
        category: 'language',
        grades: [6, 7, 8, 9, 10, 11, 12],
        maxMarks: 100,
        passMarks: 33
      },
      {
        name: 'Social Science',
        code: 'SST',
        category: 'social_science',
        grades: [6, 7, 8, 9, 10],
        maxMarks: 100,
        passMarks: 33
      },
      {
        name: 'History',
        code: 'HIS',
        category: 'social_science',
        grades: [11, 12],
        maxMarks: 100,
        passMarks: 33
      },
      {
        name: 'Geography',
        code: 'GEO',
        category: 'social_science',
        grades: [11, 12],
        maxMarks: 100,
        passMarks: 33
      },
      {
        name: 'Computer Science',
        code: 'CS',
        category: 'other',
        grades: [9, 10, 11, 12],
        maxMarks: 100,
        passMarks: 33
      },
      {
        name: 'Physical Education',
        code: 'PE',
        category: 'sports',
        grades: [6, 7, 8, 9, 10, 11, 12],
        maxMarks: 100,
        passMarks: 33
      }
    ]);
    console.log('✅ Created subjects');

    // Create Classes
    const classes = await Class.insertMany([
      {
        name: 'Class VI',
        grade: 6,
        sections: [
          { name: 'A', capacity: 40, currentStrength: 0 },
          { name: 'B', capacity: 40, currentStrength: 0 }
        ],
        subjects: subjects.filter(s => s.grades.includes(6)).map(s => s._id),
        fees: {
          tuitionFee: 0,
          admissionFee: 500,
          developmentFee: 1000,
          examFee: 200,
          otherFees: 300
        }
      },
      {
        name: 'Class VII',
        grade: 7,
        sections: [
          { name: 'A', capacity: 40, currentStrength: 0 },
          { name: 'B', capacity: 40, currentStrength: 0 }
        ],
        subjects: subjects.filter(s => s.grades.includes(7)).map(s => s._id),
        fees: {
          tuitionFee: 0,
          admissionFee: 500,
          developmentFee: 1000,
          examFee: 200,
          otherFees: 300
        }
      },
      {
        name: 'Class VIII',
        grade: 8,
        sections: [
          { name: 'A', capacity: 40, currentStrength: 0 },
          { name: 'B', capacity: 40, currentStrength: 0 }
        ],
        subjects: subjects.filter(s => s.grades.includes(8)).map(s => s._id),
        fees: {
          tuitionFee: 0,
          admissionFee: 500,
          developmentFee: 1000,
          examFee: 200,
          otherFees: 300
        }
      },
      {
        name: 'Class IX',
        grade: 9,
        sections: [
          { name: 'A', capacity: 40, currentStrength: 0 },
          { name: 'B', capacity: 40, currentStrength: 0 }
        ],
        subjects: subjects.filter(s => s.grades.includes(9)).map(s => s._id),
        fees: {
          tuitionFee: 0,
          admissionFee: 500,
          developmentFee: 1200,
          examFee: 300,
          otherFees: 400
        }
      },
      {
        name: 'Class X',
        grade: 10,
        sections: [
          { name: 'A', capacity: 40, currentStrength: 0 },
          { name: 'B', capacity: 40, currentStrength: 0 }
        ],
        subjects: subjects.filter(s => s.grades.includes(10)).map(s => s._id),
        fees: {
          tuitionFee: 0,
          admissionFee: 500,
          developmentFee: 1200,
          examFee: 500,
          otherFees: 500
        }
      },
      {
        name: 'Class XI (Science)',
        grade: 11,
        sections: [
          { name: 'A', capacity: 35, currentStrength: 0 }
        ],
        subjects: subjects.filter(s => s.grades.includes(11) && 
          ['MATH', 'PHY', 'CHE', 'BIO', 'ENG', 'PE'].includes(s.code)).map(s => s._id),
        fees: {
          tuitionFee: 0,
          admissionFee: 500,
          developmentFee: 1500,
          examFee: 600,
          otherFees: 600
        }
      },
      {
        name: 'Class XII (Science)',
        grade: 12,
        sections: [
          { name: 'A', capacity: 35, currentStrength: 0 }
        ],
        subjects: subjects.filter(s => s.grades.includes(12) && 
          ['MATH', 'PHY', 'CHE', 'BIO', 'ENG', 'PE'].includes(s.code)).map(s => s._id),
        fees: {
          tuitionFee: 0,
          admissionFee: 500,
          developmentFee: 1500,
          examFee: 1000,
          otherFees: 700
        }
      }
    ]);
    console.log('✅ Created classes');

    // Create Admin User
    const admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@emrsdornala.edu.in',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      phone: '+91-9876543210',
      isActive: true,
      isEmailVerified: true,
      address: {
        street: 'EMRS Campus',
        city: 'Dornala',
        state: 'Andhra Pradesh',
        pincode: '533345',
        country: 'India'
      }
    });
    console.log('✅ Created admin user');

    // Create Sample Teachers
    const teachers = [];
    const teacherData = [
      {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh.kumar@emrsdornala.edu.in',
        subjects: ['MATH'],
        classes: [classes[0]._id, classes[1]._id], // Class VI & VII
        qualification: 'M.Sc Mathematics, B.Ed',
        experience: 8
      },
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@emrsdornala.edu.in',
        subjects: ['ENG', 'HIN'],
        classes: [classes[2]._id, classes[3]._id], // Class VIII & IX
        qualification: 'M.A English, B.Ed',
        experience: 6
      },
      {
        firstName: 'Dr. Amit',
        lastName: 'Patel',
        email: 'amit.patel@emrsdornala.edu.in',
        subjects: ['PHY', 'CHE'],
        classes: [classes[4]._id, classes[5]._id, classes[6]._id], // Class X, XI, XII
        qualification: 'Ph.D Physics, M.Sc Chemistry',
        experience: 12
      },
      {
        firstName: 'Sunita',
        lastName: 'Singh',
        email: 'sunita.singh@emrsdornala.edu.in',
        subjects: ['BIO'],
        classes: [classes[3]._id, classes[4]._id, classes[5]._id, classes[6]._id],
        qualification: 'M.Sc Biology, B.Ed',
        experience: 10
      },
      {
        firstName: 'Ravi',
        lastName: 'Verma',
        email: 'ravi.verma@emrsdornala.edu.in',
        subjects: ['SST', 'HIS', 'GEO'],
        classes: [classes[0]._id, classes[1]._id, classes[2]._id],
        qualification: 'M.A History, B.Ed',
        experience: 7
      }
    ];

    for (const teacherInfo of teacherData) {
      const teacher = await User.create({
        firstName: teacherInfo.firstName,
        lastName: teacherInfo.lastName,
        email: teacherInfo.email,
        password: 'Teacher@123',
        role: 'teacher',
        phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        isActive: true,
        isEmailVerified: true,
        academic: {
          qualification: teacherInfo.qualification,
          experience: teacherInfo.experience,
          subjectsTeaching: subjects.filter(s => teacherInfo.subjects.includes(s.code)).map(s => s._id),
          classesTeaching: teacherInfo.classes
        },
        address: {
          street: 'Teachers Quarters',
          city: 'Dornala',
          state: 'Andhra Pradesh',
          pincode: '533345',
          country: 'India'
        }
      });
      teachers.push(teacher);
    }
    console.log('✅ Created teachers');

    // Create Sample Students
    const students = [];
    const studentNames = [
      ['Aarav', 'Gupta'], ['Vivaan', 'Sharma'], ['Aditya', 'Verma'], ['Vihaan', 'Singh'],
      ['Arjun', 'Kumar'], ['Sai', 'Patel'], ['Reyansh', 'Yadav'], ['Ayaan', 'Joshi'],
      ['Krishna', 'Reddy'], ['Ishaan', 'Nair'], ['Shaurya', 'Mishra'], ['Atharv', 'Agarwal'],
      ['Ananya', 'Sharma'], ['Diya', 'Gupta'], ['Aadhya', 'Verma'], ['Kavya', 'Singh'],
      ['Arya', 'Kumar'], ['Navya', 'Patel'], ['Myra', 'Yadav'], ['Anika', 'Joshi'],
      ['Kiara', 'Reddy'], ['Saanvi', 'Nair'], ['Avni', 'Mishra'], ['Pari', 'Agarwal']
    ];

    let studentIndex = 0;
    for (let classIndex = 0; classIndex < classes.length; classIndex++) {
      const currentClass = classes[classIndex];
      const studentsPerClass = classIndex < 5 ? 35 : 30; // Less students in higher classes

      for (let i = 0; i < studentsPerClass && studentIndex < studentNames.length; i++) {
        const [firstName, lastName] = studentNames[studentIndex];
        
        const student = await User.create({
          firstName: firstName,
          lastName: lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.emrsdornala.edu.in`,
          password: 'Student@123',
          role: 'student',
          phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          isActive: true,
          isEmailVerified: true,
          academic: {
            class: currentClass._id,
            section: 'A',
            rollNumber: i + 1,
            admissionDate: new Date('2024-04-01'),
            subjects: currentClass.subjects
          },
          guardian: {
            father: {
              name: `Mr. ${lastName}`,
              occupation: 'Farmer',
              phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`
            },
            mother: {
              name: `Mrs. ${lastName}`,
              occupation: 'Homemaker',
              phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`
            }
          },
          hostel: {
            isHostelStudent: true,
            hostelName: 'Main Hostel',
            roomNumber: `${Math.floor(Math.random() * 50) + 1}`,
            hostelFees: 5000
          },
          fees: {
            totalFees: currentClass.totalFees,
            paidFees: currentClass.totalFees,
            dueDate: new Date('2025-03-31')
          },
          address: {
            street: 'Village',
            city: 'Rural Area',
            state: 'Andhra Pradesh',
            pincode: '533345',
            country: 'India'
          }
        });
        
        students.push(student);
        studentIndex++;
      }
    }
    console.log('✅ Created students');

    // Create Sample Announcements
    const announcements = await Announcement.insertMany([
      {
        title: 'Welcome to Academic Year 2024-25',
        content: 'We warmly welcome all students to the new academic year. Classes will commence from April 1st, 2024. All students are required to report to their respective hostels by March 31st.',
        category: 'academic',
        priority: 'high',
        author: admin._id,
        targetAudience: {
          roles: ['student', 'teacher']
        },
        isActive: true,
        isPublished: true,
        isPinned: true,
        publishDate: new Date()
      },
      {
        title: 'Mid-Term Examinations Schedule',
        content: 'Mid-term examinations for all classes will be conducted from September 15th to September 25th, 2024. Detailed timetable will be shared with class teachers.',
        category: 'exam',
        priority: 'high',
        author: teachers[0]._id,
        targetAudience: {
          roles: ['student', 'teacher']
        },
        isActive: true,
        isPublished: true,
        publishDate: new Date()
      },
      {
        title: 'Independence Day Celebration',
        content: 'School will celebrate Independence Day on August 15th with flag hoisting ceremony, cultural programs, and sports activities. All students must participate.',
        category: 'event',
        priority: 'medium',
        author: admin._id,
        targetAudience: {
          roles: ['student', 'teacher']
        },
        isActive: true,
        isPublished: true,
        publishDate: new Date()
      },
      {
        title: 'Library New Book Arrivals',
        content: 'New books have arrived in the library including latest science textbooks, reference materials, and story books. Students can issue books from tomorrow.',
        category: 'general',
        priority: 'low',
        author: teachers[1]._id,
        targetAudience: {
          roles: ['student']
        },
        isActive: true,
        isPublished: true,
        publishDate: new Date()
      }
    ]);
    console.log('✅ Created announcements');

    // Create Sample Events
    const events = await Event.insertMany([
      {
        title: 'Annual Sports Day',
        description: 'Annual sports competition with various indoor and outdoor games. All students are encouraged to participate.',
        category: 'sports',
        startDate: new Date('2024-12-15'),
        endDate: new Date('2024-12-16'),
        startTime: '09:00',
        endTime: '17:00',
        venue: 'School Playground',
        organizer: teachers[4]._id,
        targetAudience: {
          roles: ['student', 'teacher']
        },
        status: 'published',
        isPublic: true
      },
      {
        title: 'Science Exhibition',
        description: 'Students will showcase their science projects and experiments. Parents and local community are invited.',
        category: 'academic',
        startDate: new Date('2024-11-20'),
        endDate: new Date('2024-11-21'),
        startTime: '10:00',
        endTime: '16:00',
        venue: 'Science Laboratory',
        organizer: teachers[2]._id,
        targetAudience: {
          roles: ['student', 'teacher']
        },
        status: 'published',
        isPublic: true
      },
      {
        title: 'Cultural Night',
        description: 'Annual cultural program featuring dance, music, and drama performances by students.',
        category: 'cultural',
        startDate: new Date('2025-01-26'),
        endDate: new Date('2025-01-26'),
        startTime: '18:00',
        endTime: '21:00',
        venue: 'School Auditorium',
        organizer: teachers[1]._id,
        targetAudience: {
          roles: ['student', 'teacher']
        },
        status: 'published',
        isPublic: true
      }
    ]);
    console.log('✅ Created events');

    console.log('🎉 Database seeding completed successfully!');
    console.log(`
    📊 Summary:
    - Subjects: ${subjects.length}
    - Classes: ${classes.length}
    - Admin: 1
    - Teachers: ${teachers.length}
    - Students: ${students.length}
    - Announcements: ${announcements.length}
    - Events: ${events.length}
    
    🔐 Login Credentials:
    Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}
    Teachers: [teacher-email] / Teacher@123
    Students: [student-email] / Student@123
    `);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
const runSeed = async () => {
  await connectDB();
  await seedData();
  process.exit(0);
};

runSeed();