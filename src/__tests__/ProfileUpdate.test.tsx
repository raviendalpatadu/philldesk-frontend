import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { message } from 'antd';
import CustomerProfilePage from '../pages/customer/CustomerProfile';
import ProfilePage from '../pages/common/ProfilePage';
import customerService from '../services/customerService';
import { authService } from '../services/authService';

// Mock the services
jest.mock('../services/customerService');
jest.mock('../services/authService');
jest.mock('../store/authStore');

// Mock antd message
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockCustomerProfile = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  address: '123 Test Street',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
};

const mockUser = {
  id: '1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('Profile Update Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CustomerProfilePage', () => {
    beforeEach(() => {
      (customerService.getProfile as jest.Mock).mockResolvedValue(mockCustomerProfile);
      (customerService.updateProfile as jest.Mock).mockResolvedValue(mockCustomerProfile);
    });

    test('loads and displays customer profile', async () => {
      render(<CustomerProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      });

      expect(customerService.getProfile).toHaveBeenCalledTimes(1);
    });

    test('enables editing when edit button is clicked', async () => {
      render(<CustomerProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit Profile');
      fireEvent.click(editButton);

      // Check that form fields are now enabled
      const firstNameInput = screen.getByDisplayValue('John');
      expect(firstNameInput).not.toBeDisabled();
    });

    test('updates profile successfully', async () => {
      render(<CustomerProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByText('Edit Profile');
      fireEvent.click(editButton);

      // Update first name
      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      // Save changes
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(customerService.updateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Jane',
          })
        );
      });

      expect(message.success).toHaveBeenCalledWith('Profile updated successfully');
    });

    test('shows password change modal', async () => {
      render(<CustomerProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Change Password')).toBeInTheDocument();
      });

      const changePasswordButton = screen.getByText('Change Password');
      fireEvent.click(changePasswordButton);

      await waitFor(() => {
        expect(screen.getByText('Current Password')).toBeInTheDocument();
        expect(screen.getByText('New Password')).toBeInTheDocument();
        expect(screen.getByText('Confirm New Password')).toBeInTheDocument();
      });
    });

    test('handles profile update error', async () => {
      (customerService.updateProfile as jest.Mock).mockRejectedValue(new Error('Update failed'));

      render(<CustomerProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      // Click edit and save
      const editButton = screen.getByText('Edit Profile');
      fireEvent.click(editButton);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Failed to update profile');
      });
    });
  });

  describe('ProfilePage', () => {
    beforeEach(() => {
      // Mock the auth store
      require('../store/authStore').useAuthStore.mockReturnValue({
        user: mockUser,
        userRole: 'ADMIN',
      });

      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.updateProfile as jest.Mock).mockResolvedValue(mockUser);
      (authService.changePassword as jest.Mock).mockResolvedValue(undefined);
    });

    test('loads and displays user profile for non-customer', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Admin')).toBeInTheDocument();
        expect(screen.getByDisplayValue('User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('admin@example.com')).toBeInTheDocument();
      });

      expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    test('updates profile successfully for non-customer', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByText('Edit Profile');
      fireEvent.click(editButton);

      // Update first name
      const firstNameInput = screen.getByDisplayValue('Admin');
      fireEvent.change(firstNameInput, { target: { value: 'SuperAdmin' } });

      // Save changes
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(authService.updateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'SuperAdmin',
          })
        );
      });

      expect(message.success).toHaveBeenCalledWith('Profile updated successfully');
    });

    test('changes password successfully', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Change Password')).toBeInTheDocument();
      });

      // Click change password button
      const changePasswordButton = screen.getByText('Change Password');
      fireEvent.click(changePasswordButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
      });

      // Fill in password form
      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      fireEvent.change(currentPasswordInput, { target: { value: 'oldpass' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

      // Submit password change
      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authService.changePassword).toHaveBeenCalledWith('oldpass', 'newpass123');
      });

      expect(message.success).toHaveBeenCalledWith('Password changed successfully');
    });

    test('handles password validation errors', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Change Password')).toBeInTheDocument();
      });

      // Click change password button
      const changePasswordButton = screen.getByText('Change Password');
      fireEvent.click(changePasswordButton);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      // Fill in mismatched passwords
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpass' } });

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      // Ensure service was not called
      expect(authService.changePassword).not.toHaveBeenCalled();
    });
  });
});
