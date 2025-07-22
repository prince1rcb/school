const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Common fields
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password required if not Google user
        }
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    avatar: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    
    // Google OAuth
    googleId: {
        type: String,
        sparse: true
    },
    
    // Student specific fields
    studentId: {
        type: String,
        unique: true,
        sparse: true
    },
    class: {
        type: String,
        enum: ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
    },
    section: {
        type: String,
        enum: ['A', 'B', 'C', 'D']
    },
    rollNumber: {
        type: Number
    },
    admissionDate: {
        type: Date
    },
    guardianName: {
        type: String
    },
    guardianPhone: {
        type: String
    },
    guardianEmail: {
        type: String
    },
    hostelRoom: {
        type: String
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    dateOfBirth: {
        type: Date
    },
    
    // Teacher specific fields
    teacherId: {
        type: String,
        unique: true,
        sparse: true
    },
    subjects: [{
        type: String
    }],
    classes: [{
        class: String,
        section: String
    }],
    designation: {
        type: String
    },
    qualification: {
        type: String
    },
    experience: {
        type: Number // years
    },
    joiningDate: {
        type: Date
    },
    
    // Admin specific fields
    adminId: {
        type: String,
        unique: true,
        sparse: true
    },
    department: {
        type: String
    },
    permissions: [{
        type: String,
        enum: [
            'user_management',
            'content_management',
            'academic_control',
            'result_management',
            'campus_management',
            'system_settings'
        ]
    }],
    
    // Common timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 }, { sparse: true });
userSchema.index({ teacherId: 1 }, { sparse: true });
userSchema.index({ adminId: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ class: 1, section: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to update timestamp
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.__v;
    return userObject;
};

// Method to generate user ID based on role
userSchema.methods.generateUserId = function() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    switch (this.role) {
        case 'student':
            return `STU${year}${random}`;
        case 'teacher':
            return `TCH${year}${random}`;
        case 'admin':
            return `ADM${year}${random}`;
        default:
            return `USR${year}${random}`;
    }
};

// Static method to find user by login credentials
userSchema.statics.findByCredentials = async function(identifier, password, userType) {
    let user;
    
    // Find user based on role and identifier
    switch (userType) {
        case 'student':
            user = await this.findOne({
                $or: [
                    { studentId: identifier },
                    { email: identifier }
                ],
                role: 'student',
                isActive: true
            });
            break;
        case 'teacher':
            user = await this.findOne({
                $or: [
                    { teacherId: identifier },
                    { email: identifier }
                ],
                role: 'teacher',
                isActive: true
            });
            break;
        case 'admin':
            user = await this.findOne({
                $or: [
                    { adminId: identifier },
                    { email: identifier }
                ],
                role: 'admin',
                isActive: true
            });
            break;
        default:
            throw new Error('Invalid user type');
    }
    
    if (!user) {
        throw new Error('Invalid credentials');
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    return user;
};

// Virtual for full name (if first and last name are stored separately in future)
userSchema.virtual('displayName').get(function() {
    return this.name;
});

// Transform JSON output
userSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;