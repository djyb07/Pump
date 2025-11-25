import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../prisma';

// DEBUG: Log environment variables
console.log('=== GOOGLE OAUTH CONFIGURATION ===');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'MISSING!');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING!');
console.log('SERVER_URL:', process.env.SERVER_URL);
const callbackURL = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`;
console.log('Callback URL:', callbackURL);
console.log('===================================');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: callbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists
                let user = await prisma.user.findUnique({
                    where: { googleId: profile.id },
                });

                if (!user) {
                    // Check if user exists with same email
                    const existingUser = await prisma.user.findUnique({
                        where: { email: profile.emails?.[0].value },
                    });

                    if (existingUser) {
                        // Link googleId to existing user
                        user = await prisma.user.update({
                            where: { id: existingUser.id },
                            data: { googleId: profile.id },
                        });
                    } else {
                        // Create new user
                        user = await prisma.user.create({
                            data: {
                                googleId: profile.id,
                                email: profile.emails?.[0].value || '',
                                firstName: profile.name?.givenName || '',
                                lastName: profile.name?.familyName || '',
                                password: '', // No password for OAuth users
                            },
                        });
                    }
                }

                return done(null, user);
            } catch (error) {
                return done(error as any, false);
            }
        }
    )
);

export default passport;
