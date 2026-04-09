declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: number;
        role: string;
        username: string;
      };
      requestId?: string;
      uploadedImage?: {
        bytes?: number;
        format?: string;
        height?: number;
        publicId: string;
        secureUrl: string;
        width?: number;
      };
      userId?: number;
    }
  }
}

export {};
