import { verifyToken } from './jwt';

export function getUserIdFromRequest(req: Request): string | null {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const tokenCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('token='));

    if (!tokenCookie) return null;
    const token = tokenCookie.split('=')[1];
    if (!token) return null;

    const decoded = verifyToken(decodeURIComponent(token));
    if (!decoded) return null;

    return decoded.userId;
  } catch (error) {
    console.error('Error extracting userId from request:', error);
    return null;
  }
}
