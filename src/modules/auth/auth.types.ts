export interface IRegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  preferred_language?: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IRefreshInput {
  refresh_token: string;
}

export interface IForgotPasswordInput {
  email: string;
}

export interface IResetPasswordInput {
  token: string;
  password: string;
}

export interface IResendVerificationInput {
  email: string;
}

export interface IAuthResponse {
  user: {
    _id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
    preferred_language: string;
    is_verified: boolean;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}
