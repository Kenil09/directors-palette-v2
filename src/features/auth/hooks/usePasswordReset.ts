'use client';

import { useState } from 'react';
import { AuthService } from '../services/auth.service';
import type { PasswordResetState } from '../types/auth.types';

export function usePasswordReset() {
  const [state, setState] = useState<PasswordResetState>({
    isLoading: false,
    error: null,
    success: false,
    message: null,
  });

  const requestReset = async (email: string) => {
    setState({ isLoading: true, error: null, success: false, message: null });

    const { error } = await AuthService.requestPasswordReset(email);

    if (error) {
      setState({
        isLoading: false,
        error: error.message,
        success: false,
        message: null,
      });
      return { success: false };
    }

    setState({
      isLoading: false,
      error: null,
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    });

    return { success: true };
  };

  const resetPassword = async (password: string) => {
    setState({ isLoading: true, error: null, success: false, message: null });

    const { error } = await AuthService.updatePassword(password);

    if (error) {
      setState({
        isLoading: false,
        error: error.message,
        success: false,
        message: null,
      });
      return { success: false };
    }

    setState({
      isLoading: false,
      error: null,
      success: true,
      message: 'Password updated successfully!',
    });

    return { success: true };
  };

  return {
    ...state,
    requestReset,
    resetPassword,
  };
}
