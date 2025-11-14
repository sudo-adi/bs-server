declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username?: string;
        role_id?: string;
        // Worker portal fields
        profileId?: string;
        phone?: string;
        type?: string;
      };
    }
  }
}
