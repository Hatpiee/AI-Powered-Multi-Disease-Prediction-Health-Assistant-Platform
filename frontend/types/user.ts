export interface User {
  id: number;
  email: string;
  full_name: string;
  gender: string | null;
  date_of_birth: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
