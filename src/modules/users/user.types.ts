export interface IUpdateProfileInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
  preferred_language?: string;
}

export interface IChangePasswordInput {
  current_password: string;
  new_password: string;
}

export interface IUserProfile {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  preferred_language: string;
  user_type: string;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: Date;
}
