import 'next-auth';

declare module 'next-auth' {
  interface User {
    role: 'shopkeeper' | 'customer';
    id: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: 'shopkeeper' | 'customer';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'shopkeeper' | 'customer';
    id: string;
  }
}

