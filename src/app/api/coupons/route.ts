import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Definindo os modelos
const StoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  logo: { type: String },
  url: { type: String },
  description: { type: String },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  provider: { type: String, required: true },
  hasOffers: { type: Boolean, default: false },
  externalId: { type: String },
  affiliateLink: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CouponSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['percentage', 'fixed', 'freeShipping'], required: true },
  value: { type: Number },
  url: { type: String },
  affiliateLink: { type: String },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  expiresAt: { type: Date, required: true },
  active: { type: Boolean, default: true },
  provider: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    await connectDB();
    
    const query = storeId ? { store: storeId } : {};
    const coupons = await Coupon.find(query)
      .populate('store')
      .sort({ createdAt: -1 });
      
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Erro ao buscar cupons:', error);
    return NextResponse.json({ error: 'Erro ao buscar cupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectDB();
    
    // Adiciona campos padrão
    const couponData = {
      ...body,
      provider: 'manual',
      expiresAt: body.expiryDate, // Corrigido para expiresAt
      url: body.affiliateLink, // URL é o link de afiliado
      affiliateLink: body.affiliateLink // Mantemos em ambos os campos por compatibilidade
    };
    
    const coupon = await Coupon.create(couponData);
    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro ao criar cupom'
    }, { status: 500 });
  }
}
