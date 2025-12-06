import 'next-auth';

declare module 'next-auth' {
  interface User {
    role: 'shopkeeper' | 'customer';
    id: string;
    name: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: 'shopkeeper' | 'customer';
      name: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'shopkeeper' | 'customer';
    id: string;
    name: string;
  }
}

