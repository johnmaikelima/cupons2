import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(request: Request) {
  try {
    // Verificar se já existe algum usuário admin
    await connectToDatabase();
    const existingAdmin = await User.findOne({ isAdmin: true });
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Setup já foi realizado. Um admin já existe.' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { email, password } = data;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário admin
    const newAdmin = await User.create({
      email,
      password: hashedPassword,
      isAdmin: true
    });

    return NextResponse.json(
      { message: 'Admin criado com sucesso', userId: newAdmin._id },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Erro ao criar admin:', error);
    return NextResponse.json(
      { error: 'Erro ao criar admin' },
      { status: 500 }
    );
  }
}
