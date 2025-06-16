import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import InputField from '../components/InputField';
import { imageSampleProfile } from '../assets/assets';
import { FaSave, FaPen, FaTimes } from 'react-icons/fa';

interface UserProfile {
  id?: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  organization: string; // Changed from optional to required to match backend
  createdAt?: number;
  updatedAt?: number;
}

export default function ProfilePage() {
  // Initial empty user data
  const initialUserData: UserProfile = {
    name: '',
    email: '',
    phone: '',
    country: '',
    organization: '',
  };

  const [user, setUser] = useState<UserProfile>(initialUserData);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfile>(initialUserData);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{success: boolean; message: string} | null>(null);

  // Load profile on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await window.electron.getUserProfile();
        if (result.success && result.profile) {
          setUser(result.profile);
          setEditData(result.profile);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleEdit = async () => {
    if (isEditing) {
      // Save changes
      setSaveStatus(null);
      try {
        const result = await window.electron.saveUserProfile(editData);
        if (result.success) {
          setUser({...editData});
          setSaveStatus({
            success: true,
            message: 'Profile saved successfully!'
          });
        } else {
          setSaveStatus({
            success: false,
            message: result.error || 'Failed to save profile'
          });
        }
      } catch (error) {
        console.error('Error saving profile:', error);
        setSaveStatus({
          success: false,
          message: error instanceof Error ? error.message : 'An error occurred while saving'
        });
      }
      setIsEditing(false);
    } else {
      // Start editing
      setEditData({...user});
      setIsEditing(true);
      setSaveStatus(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({...user});
    setSaveStatus(null);
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setEditData((prev: UserProfile) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      {/* Header */}
      <Header
        title="Profile"
        subtitle="View and edit your profile information."
      />

      <div className="max-w-3xl mx-auto w-full p-4 flex-1">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile Header with Avatar */}
          <div className="bg-gradient-to-r from-violet-500 to-violet-600 p-6 flex flex-col items-center">
            <div className="mb-4 p-1 bg-white rounded-full shadow-md">
              <Avatar imageUrl={imageSampleProfile} size={100} />
            </div>
            <h2 className="text-white text-xl font-semibold">{user.name}</h2>
            <p className="text-violet-100">{user.email}</p>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {/* Action Buttons */}
            <div className="flex justify-end mb-6">              {isLoading ? (
                <div className="px-4 py-2 text-gray-500">Loading...</div>
              ) : isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded mr-2 transition shadow-sm"
                  >
                    <FaSave className="mr-2" /> Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition shadow-sm"
                  >
                    <FaTimes className="mr-2" /> Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded transition shadow-sm"
                >
                  <FaPen className="mr-2" /> Edit Profile
                </button>
              )}
            </div>            {/* Save Status Message */}
            {saveStatus && (
              <div className={`mb-4 p-2 rounded text-center ${saveStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {saveStatus.message}
              </div>
            )}
            
            {/* Profile Fields */}
            <div className="divide-y divide-gray-100">
              {isEditing ? (
                // Edit Mode
                <div className="space-y-4">
                  <InputField
                    label="Name"
                    value={editData.name}
                    onChange={(value) => handleChange('name', value)}
                  />
                  <InputField
                    label="Email"
                    value={editData.email}
                    onChange={(value) => handleChange('email', value)}
                  />
                  <InputField
                    label="Phone"
                    value={editData.phone}
                    onChange={(value) => handleChange('phone', value)}
                  />
                  <InputField
                    label="Country"
                    value={editData.country}
                    onChange={(value) => handleChange('country', value)}
                  />
                  <InputField
                    label="Organization"
                    value={editData.organization}
                    onChange={(value) => handleChange('organization', value)}
                  />
                </div>
              ) : (
                // View Mode
                <>
                  <div className="py-4">
                    <label className="block text-violet-800 text-xs font-semibold uppercase mb-1">Name</label>
                    <p className="text-gray-700">{user.name || 'Not set'}</p>
                  </div>
                  <div className="py-4">
                    <label className="block text-violet-800 text-xs font-semibold uppercase mb-1">Email</label>
                    <p className="text-gray-700">{user.email || 'Not set'}</p>
                  </div>
                  <div className="py-4">
                    <label className="block text-violet-800 text-xs font-semibold uppercase mb-1">Phone</label>
                    <p className="text-gray-700">{user.phone || 'Not set'}</p>
                  </div>
                  <div className="py-4">
                    <label className="block text-violet-800 text-xs font-semibold uppercase mb-1">Country</label>
                    <p className="text-gray-700">{user.country || 'Not set'}</p>
                  </div>
                  <div className="py-4">
                    <label className="block text-violet-800 text-xs font-semibold uppercase mb-1">Organization</label>
                    <p className="text-gray-700">{user.organization || 'Not set'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
