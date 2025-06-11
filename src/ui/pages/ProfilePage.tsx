import Header from '../components/Header';
import Avatar from '../components/Avatar';
import { imageSampleProfile } from '../assets/assets';

export default function ProfilePage() {
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
  };

  const handleEdit = () => {
    console.log('Edit Profile');
  };

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Header */}
      <Header
        title="Profile"
        subtitle="View and edit your profile information."
      />

      {/* Content */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 flex-1">
        {/* Profile Picture & Edit (center aligned) */}
        <div className="flex flex-col items-center w-full sm:w-1/4">
          <Avatar imageUrl={imageSampleProfile} size={80} />
          <button
            onClick={handleEdit}
            className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-sm"
          >
            Edit Profile
          </button>
        </div>

        {/* User Info */}
        <div className="flex-1 bg-gray-50 rounded p-4 shadow">
          <div className="mb-4">
            <label className="block text-gray-600 text-xs font-semibold uppercase mb-1">Name</label>
            <p className="text-gray-800">{user.name}</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 text-xs font-semibold uppercase mb-1">Email</label>
            <p className="text-gray-800">{user.email}</p>
          </div>
          <div>
            <label className="block text-gray-600 text-xs font-semibold uppercase mb-1">Phone</label>
            <p className="text-gray-800">{user.phone}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
