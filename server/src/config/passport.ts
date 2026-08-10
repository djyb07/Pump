import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../prisma';

const callbackURL = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`;

/**
 * Whether Google sign-in is available on this deployment.
 *
 * passport-oauth2 throws at construction time on an empty clientID, so the
 * strategy must not be registered at all when the credentials are absent —
 * otherwise the whole server fails to boot. Google OAuth is documented as
 * optional and is now genuinely optional.
 *
 * Note: `dotenv` has already run by this point via the `prisma` import above,
 * so a .env-provided value is visible here.
 */
export const isGoogleOAuthConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

if (isGoogleOAuthConfigured) {
    passport.use(
        new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
} else {
    console.warn(
        'INFO: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set. ' +
        'Google sign-in is disabled; email/password login is unaffected.'
    );
}

export default passport;
