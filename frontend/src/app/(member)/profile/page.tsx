'use client';

import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  FileText, 
  UploadCloud, 
  Image as ImageIcon,
  ShieldAlert,
  Save,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMemberAuthStore } from '@/store/memberAuthStore';
import api from '@/services/api';

export default function MemberProfile() {
  const { user, setUser, token } = useMemberAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    student_id: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync with current auth store user details
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        student_id: user.student_id || '',
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // 1. Update text profile details
      let updatedUser = user;
      const response = await api.put('/member/profile', formData);
      if (response.data?.data) {
        updatedUser = response.data.data;
      }

      // 2. Upload avatar if a new one was selected
      if (selectedAvatarFile) {
        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('avatar', selectedAvatarFile);

        const avatarResponse = await api.post('/member/profile/avatar', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (avatarResponse.data?.data) {
          updatedUser = avatarResponse.data.data;
        }
        setIsUploading(false);
        setSelectedAvatarFile(null); // Clear selected file after successful upload
      }

      // Update global state and notify user
      if (updatedUser) {
        setUser(updatedUser);
        toast.success('Profile saved successfully!');
      }

    } catch (error: any) {
      setIsUploading(false);
      const msg = error.response?.data?.message || 'Failed to save profile';
      const errorDetails = error.response?.data?.errors;

      if (errorDetails) {
        setErrors(errorDetails);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    prepareAvatarFile(files[0]);
  };

  const prepareAvatarFile = (file: File) => {
    // 2MB size check
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image exceeds 2MB maximum limit');
      return;
    }
    
    // Store file in state for later upload
    setSelectedAvatarFile(file);

    // Set immediate client preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      prepareAvatarFile(files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ST';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in text-left">
      
      {/* Page Title */}
      <div>
        <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <User className="h-5 w-5 text-violet-400" /> Student Profile settings
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
          Manage your personal details, secure your student credentials, and configure your portal profile avatar uploader.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Avatar Uploader */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 shadow-xl space-y-6 flex flex-col items-center justify-between text-center">
          
          <div className="space-y-4 w-full flex flex-col items-center">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider self-start">
              Profile Avatar
            </h4>

            {/* Avatar container */}
            <div className="relative group h-32 w-32 rounded-full overflow-hidden border-2 border-violet-500/30 bg-slate-950 flex items-center justify-center shadow-lg shadow-violet-500/5">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt={user?.name} 
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="text-3xl font-extrabold text-violet-400">{initials}</span>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                  <svg className="h-7 w-7 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-white">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1 capitalize">{user?.email}</p>
            </div>
          </div>

          {/* Drag & Drop zone */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className="w-full py-6 px-4 rounded-xl border border-dashed border-slate-800 hover:border-violet-500/40 bg-slate-950/40 hover:bg-slate-900/30 cursor-pointer transition-all duration-200"
          >
            <UploadCloud className="h-6 w-6 text-slate-500 mx-auto mb-2" />
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Drag & drop image file or <span className="text-violet-400 font-bold hover:underline">browse</span>
            </p>
            <p className="text-[9px] text-slate-600 mt-1">Supports PNG, JPG (Max 2MB)</p>
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

        </div>

        {/* Right column: Form details */}
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/10 backdrop-blur-md p-6 sm:p-8 shadow-xl space-y-6">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">
            Account Specifications
          </h4>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                type="text"
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name?.[0]}
                required
              />
              <Input 
                type="email"
                name="email"
                label="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email?.[0]}
                required
              />
            </div>

            <Input 
              type="text"
              name="student_id"
              label="Student Identification ID"
              placeholder="e.g. STU-2026-001"
              value={formData.student_id}
              onChange={handleInputChange}
              error={errors.student_id?.[0]}
              helperText="Provide your student register card number to link with rosters."
            />

            <div className="pt-4 border-t border-slate-900/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Account Status: Active Student Portal</span>
              </div>
              <Button 
                type="submit"
                variant="primary"
                className="w-full sm:w-auto px-5 py-2.5"
                isLoading={isLoading}
              >
                <Save className="h-4 w-4 mr-1.5 shrink-0" /> Save Profile Details
              </Button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
