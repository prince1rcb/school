# EMRS Dornala School Website

A comprehensive school management website for Eklavya Model Residential School (EMRS) Dornala, featuring modern design, role-based access control, and complete school management functionality.

## Features

### Frontend Features
- **Responsive Design**: Modern, mobile-first design using Bootstrap 5
- **Dynamic Content**: News, achievements, and announcements loaded dynamically
- **Multi-section Layout**: 
  - Home page with hero section
  - About Us with management and academic perspectives
  - Campus Life (Facilities, Safety, Rules, Student Chapter)
  - News & Events
  - Admissions process for EMRS entrance exam
  - Achievements showcase
  - Contact form
- **User Authentication**: Student, Teacher, and Admin login portals
- **Google OAuth Integration**: Alternative login method
- **Modern UI/UX**: Smooth animations, hover effects, and attractive styling

### Backend Features
- **RESTful API**: Complete API for all frontend operations
- **Role-Based Access Control**: Three user roles with different permissions
  - **Students**: Personal dashboard, results, schedule, hostel info
  - **Teachers**: Class management, student performance, content upload
  - **Admins**: Complete system management, user control, content management
- **JWT Authentication**: Secure token-based authentication
- **Google OAuth**: Social login integration
- **MongoDB Database**: Scalable NoSQL database
- **File Upload**: Support for images and documents
- **Email Integration**: Contact forms and notifications
- **Rate Limiting**: API protection against abuse
- **Security**: Helmet.js, CORS, input validation

### Admin Dashboard Features
- User Management (Create, Read, Update, Delete users)
- Content Management (News, Achievements, Announcements)
- Academic Control (Classes, Sections, Results)
- Campus Management (Facilities, Rules, Safety)
- Reports and Analytics
- System Settings

### Teacher Dashboard Features
- Student Performance Tracking
- Schedule Management
- Resource Upload and Sharing
- Class Dashboard
- Internal Notices
- Assignment Management

### Student Dashboard Features
- Personal Information
- Academic Results and Progress
- Class Schedule and Timetable
- Study Materials Access
- Hostel and Campus Information
- Announcements and News
- Fee Status and Payment History

## Technology Stack

### Frontend
- **HTML5, CSS3, JavaScript**
- **Bootstrap 5**: Responsive framework
- **jQuery**: DOM manipulation and AJAX
- **Font Awesome**: Icons
- **Google Fonts**: Typography

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication tokens
- **Passport.js**: Authentication middleware
- **Bcrypt**: Password hashing
- **Multer**: File uploads
- **Nodemailer**: Email sending
- **Express Validator**: Input validation
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd emrs-website

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/emrs-dornala

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The application will create the database automatically

#### Option B: MongoDB Atlas (Cloud)
1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update MONGODB_URI in .env file

### 4. Start the Application

#### Start Backend Server
```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```

#### Start Frontend Server
```bash
cd frontend
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Default User Accounts

The system includes default users for testing:

### Admin Account
- **ID**: ADM20240001
- **Password**: admin123456
- **Role**: Administrator

### Teacher Account
- **ID**: TCH20240001
- **Password**: teacher123456
- **Role**: Teacher

### Student Account
- **ID**: STU20240001
- **Password**: student123456
- **Role**: Student

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Public Content
- `GET /api/news` - Get published news
- `GET /api/achievements` - Get achievements
- `GET /api/announcements` - Get announcements
- `POST /api/contact` - Submit contact form

### Admin Routes
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - User management
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Deactivate user

### Teacher Routes
- `GET /api/teacher/dashboard` - Teacher dashboard
- `GET /api/teacher/students` - Assigned students
- `GET /api/teacher/schedule` - Class schedule

### Student Routes
- `GET /api/student/dashboard` - Student dashboard
- `GET /api/student/results` - Academic results
- `GET /api/student/schedule` - Class timetable
- `GET /api/student/hostel` - Hostel information

## Project Structure

```
emrs-website/
├── frontend/
│   ├── index.html              # Main HTML file
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css       # Custom styles
│   │   ├── js/
│   │   │   └── main.js         # Frontend JavaScript
│   │   └── images/
│   │       └── logo.png        # School logo
│   └── package.json
├── backend/
│   ├── server.js               # Main server file
│   ├── config/
│   │   └── passport.js         # Passport configuration
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── News.js             # News model
│   │   └── Achievement.js      # Achievement model
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── admin.js            # Admin routes
│   │   ├── teacher.js          # Teacher routes
│   │   ├── student.js          # Student routes
│   │   ├── news.js             # News routes
│   │   ├── achievements.js     # Achievement routes
│   │   ├── announcements.js    # Announcement routes
│   │   └── contact.js          # Contact routes
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   └── errorHandler.js     # Error handling
│   ├── .env                    # Environment variables
│   └── package.json
└── README.md
```

## Features in Detail

### EMRS Entrance Exam Process
The website includes a dedicated section explaining the EMRS entrance exam process:
1. **Application**: Online application submission
2. **Entrance Exam**: Competitive examination
3. **Merit List**: Results and selection criteria
4. **Admission**: Free education for selected students

### Campus Management
- **Facilities**: Science labs, library, sports complex, computer lab
- **Safety & Security**: 24/7 security, CCTV monitoring, trained staff
- **Rules**: Hostel rules, academic regulations, discipline policy
- **Student Chapter**: Student council, clubs, activities

### Content Management
- Dynamic news and events system
- Achievement showcase with categories
- Rotating announcements
- Contact form with email integration

## Customization

### Branding
- Update logo in `frontend/public/images/logo.png`
- Modify colors in CSS variables in `frontend/public/css/style.css`
- Update school information in HTML content

### Database Schema
- Extend User model for additional fields
- Create new models for specific requirements
- Add custom validation rules

### API Extensions
- Add new endpoints for custom features
- Implement additional middleware
- Extend authentication strategies

## Security Features

- **Input Validation**: Express-validator for all inputs
- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Secure authentication tokens
- **Rate Limiting**: Prevent API abuse
- **CORS**: Controlled cross-origin requests
- **Helmet**: Security headers
- **Role-based Access**: Granular permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Email: info@emrsdornala.edu.in
- Phone: +91 12345 67890

## Acknowledgments

- EMRS Dornala School Administration
- Ministry of Tribal Affairs, Government of India
- Bootstrap team for the responsive framework
- All contributors and supporters

---

**EMRS Dornala** - Excellence in Education Through Quality Learning and Holistic Development