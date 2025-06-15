import { useState } from 'react';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import InputField from '../components/InputField';
import { imageSampleProfile } from '../assets/assets';
import { FaSave, FaPen, FaTimes } from 'react-icons/fa';

type UserProfile = {
  name: string;
  email: string;
  phone: string;
  country: string;
};

export default function ProfilePage() {
  // Initial user data
  const initialUserData: UserProfile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    country: 'United States',
  };

  const [user, setUser] = useState<UserProfile>(initialUserData);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfile>(initialUserData);

  const handleEdit = () => {
    if (isEditing) {
      // Save changes
      setUser({...editData});
      setIsEditing(false);
    } else {
      // Start editing
      setEditData({...user});
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({...user});
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setEditData(prev => ({
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
            <div className="flex justify-end mb-6">
              {isEditing ? (
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
            </div>

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
                </div>
              ) : (
                // View Mode
                <>
                  <div className="py-4">
                    <label className="block text-violet-800 text-xs font-semibold uppercase mb-1">Name</label>
                    <p className="text-gray-700">{user.name}</p>
                  </div>
                  <div className="py-4">
                    <label className="block text-violet-800 text-xs font-semibold uppercase mb-1">Email</label>
                    <p className="text-gray-700">{user.email}</p>
                  </div>
                  <div className="py-4">
                    <label className="block text-violet-800 text-xs font-semibold uppercase mb-1">Phone</label>
                    <p className="text-gray-700">{user.phone}</p>
                  </div>
                  <div className="py-4">
                    <label className="block text-violet-800 text-xs font-semibold uppercase mb-1">Country</label>
                    <p className="text-gray-700">{user.country}</p>
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
