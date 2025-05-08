import mongoose from 'mongoose';

export interface Page {
  title: string;
  slug: string;
  content: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pageSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  slug: { 
    type: String, 
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  content: { 
    type: String, 
    required: true 
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices
pageSchema.index({ slug: 1 }, { unique: true });
pageSchema.index({ active: 1 });
pageSchema.index({ createdAt: -1 });

// Remover modelo existente se houver
if (mongoose.models.Page) {
  delete mongoose.models.Page;
}

// Criar novo modelo
export const Page = mongoose.model('Page', pageSchema);
