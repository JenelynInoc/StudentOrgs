export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'officer' | 'admin';
  student_id?: string;
  memberships?: Membership[];
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  organizations_count?: number;
}

export interface Organization {
  id: number;
  name: string;
  acronym: string;
  description: string;
  logo_path?: string;
  category_id: number;
  category?: Category;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Membership {
  id: number;
  user_id: number;
  user?: User;
  organization_id: number;
  organization?: Organization;
  role: 'member' | 'officer';
  officer_title?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Event {
  id: number;
  organization_id: number;
  organization?: Organization;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  created_at: string;
}

export interface EventParticipation {
  id: number;
  event_id: number;
  event?: Event;
  user_id: number;
  user?: User;
  status: 'registered' | 'attended' | 'absent';
  created_at: string;
}

export interface Announcement {
  id: number;
  organization_id: number;
  organization?: Organization;
  title: string;
  content: string;
  posted_by: number;
  author?: User;
  created_at: string;
}
