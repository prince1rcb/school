const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() { return !this.googleId; },
    minlength: [6, 'Password must be at least 6 characters']
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: true,
    default: 'student'
  },
  
  // Unique Identifiers
  employeeId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but ensures uniqueness when present
    required: function() { return this.role === 'teacher' || this.role === 'admin'; }
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    required: function() { return this.role === 'student'; }
  },
  
  // Contact Information
  phone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  alternativePhone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  
  // Personal Information
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  religion: String,
  caste: String,
  nationality: { type: String, default: 'Indian' },
  
  // Guardian Information (for students)
  guardian: {
    father: {
      name: String,
      occupation: String,
      phone: String,
      email: String
    },
    mother: {
      name: String,
      occupation: String,
      phone: String,
      email: String
    },
    localGuardian: {
      name: String,
      relation: String,
      phone: String,
      email: String,
      address: String
    }
  },
  
  // Academic Information
  academic: {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: function() { return this.role === 'student'; }
    },
    section: String,
    rollNumber: Number,
    admissionDate: Date,
    admissionNumber: String,
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }],
    // For teachers
    qualification: String,
    experience: Number,
    specialization: String,
    subjectsTeaching: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }],
    classesTeaching: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }]
  },
  
  // System Information
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Google OAuth
  googleId: String,
  
  // Last Login
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },
  
  // Hostel Information (for students)
  hostel: {
    isHostelStudent: { type: Boolean, default: false },
    hostelName: String,
    roomNumber: String,
    hostelFees: Number
  },
  
  // Financial Information
  fees: {
    totalFees: { type: Number, default: 0 },
    paidFees: { type: Number, default: 0 },
    dueDate: Date,
    lastPaymentDate: Date
  },
  
  // Medical Information
  medical: {
    allergies: [String],
    medications: [String],
    emergencyContact: {
      name: String,
      relation: String,
      phone: String
    },
    medicalHistory: String
  },
  
  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for outstanding fees
userSchema.virtual('outstandingFees').get(function() {
  return this.fees.totalFees - this.fees.paidFees;
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'academic.class': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate unique IDs
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      if (this.role === 'student' && !this.studentId) {
        const year = new Date().getFullYear().toString().slice(-2);
        const count = await this.constructor.countDocuments({ role: 'student' });
        this.studentId = `STU${year}${(count + 1).toString().padStart(4, '0')}`;
      }
      
      if ((this.role === 'teacher' || this.role === 'admin') && !this.employeeId) {
        const prefix = this.role === 'admin' ? 'ADM' : 'TCH';
        const year = new Date().getFullYear().toString().slice(-2);
        const count = await this.constructor.countDocuments({ 
          role: { $in: ['teacher', 'admin'] } 
        });
        this.employeeId = `${prefix}${year}${(count + 1).toString().padStart(4, '0')}`;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Instance method to generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = require('crypto').randomBytes(32).toString('hex');
  
  this.emailVerificationToken = require('crypto')
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Static method to find by student ID
userSchema.statics.findByStudentId = function(studentId) {
  return this.findOne({ studentId, role: 'student' });
};

// Static method to find by employee ID
userSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ 
    employeeId, 
    role: { $in: ['teacher', 'admin'] } 
  });
};

module.exports = mongoose.model('User', userSchema);