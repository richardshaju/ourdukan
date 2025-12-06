import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    console.log('Registration request body:', { name, email, role });

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields', received: { name: !!name, email: !!email, password: !!password, role: !!role } },
        { status: 400 }
      );
    }

    if (!['shopkeeper', 'customer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      rewardPoints: 0,
    });

    console.log('User object before save:', { name: user.name, email: user.email, role: user.role });

    await user.save();

    console.log('User saved successfully:', { id: user._id, name: user.name });

    // Verify the user was saved correctly
    const savedUser = await User.findById(user._id);
    console.log('Verified saved user:', { id: savedUser?._id, name: savedUser?.name, email: savedUser?.email });

    return NextResponse.json(
      { message: 'User created successfully', userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

