import { NextAuthOptions, DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      isAdmin: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    isAdmin: boolean;
  }
}
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais inválidas');
        }

        await connectDB();

        const UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
          email: { type: String, required: true, unique: true },
          password: { type: String, required: true },
          isAdmin: { type: Boolean, default: false },
          createdAt: { type: Date, default: Date.now }
        }));

        const user = await UserModel.findOne({ email: credentials.email });
        
        if (!user || !user.password) {
          throw new Error('Usuário não encontrado');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Senha incorreta');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          isAdmin: user.isAdmin
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    }
  },
  pages: {
    signIn: '/admin/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
};
