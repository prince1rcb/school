const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'emrs-dornala-secret-key';

module.exports = function(passport) {
    // Google OAuth Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
                callbackURL: '/api/auth/google/callback'
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists with this Google ID
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        return done(null, user);
                    }

                    // Check if user exists with same email
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // Link Google account to existing user
                        user.googleId = profile.id;
                        await user.save();
                        return done(null, user);
                    }

                    // Create new user
                    user = new User({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        avatar: profile.photos[0]?.value || '',
                        role: 'student', // Default role, can be changed by admin
                        isActive: true
                    });

                    // Generate student ID for new Google users
                    user.studentId = user.generateUserId();

                    await user.save();
                    return done(null, user);

                } catch (error) {
                    console.error('Google OAuth error:', error);
                    return done(error, null);
                }
            }
        )
    );

    // JWT Strategy
    passport.use(
        new JwtStrategy(
            {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: JWT_SECRET
            },
            async (jwtPayload, done) => {
                try {
                    const user = await User.findById(jwtPayload.userId).select('-password');
                    
                    if (user && user.isActive) {
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                } catch (error) {
                    console.error('JWT Strategy error:', error);
                    return done(error, false);
                }
            }
        )
    );

    // Serialize user for session (not used in JWT setup, but good to have)
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id).select('-password');
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};