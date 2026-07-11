import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword, createSession, getSessionCookieConfig, needsHashUpgrade, upgradePasswordHash } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format d\'email invalide' }, { status: 400 });
    }

    // Check if admin exists, if not create default admin
    let user = await db.user.findUnique({ where: { email } });

    if (!user && (email === 'supportclasscenter@gmail.com' || email === 'admin@classcenter.com' || email === 'cedrickonan44@gmail.com')) {
      const hashed = await hashPassword('cedriC1990');
      user = await db.user.create({
        data: {
          email,
          name: 'Administrateur',
          password: hashed,
          role: 'ADMIN',
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    // Upgrade SHA-256 hash to bcrypt if needed
    if (needsHashUpgrade(user.password)) {
      try {
        const newHash = await upgradePasswordHash(password);
        await db.user.update({
          where: { id: user.id },
          data: { password: newHash },
        });
      } catch (upgradeError) {
        console.error('Password hash upgrade failed:', upgradeError);
        // Don't fail the login — just log the error
      }
    }

    // Create JWT session
    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      cabineId: user.cabineId || undefined,
    });

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      cabineId: user.cabineId,
      actionCount: user.actionCount,
      isLoyal: user.isLoyal,
    });

    // Set HttpOnly cookie
    response.cookies.set(getSessionCookieConfig().name, token, getSessionCookieConfig());

    return response;
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Erreur serveur: ${message}` }, { status: 500 });
  }
}
