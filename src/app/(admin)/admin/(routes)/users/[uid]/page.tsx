"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  Edit3,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Crown,
} from "lucide-react";

interface UserDetailsPageProps {
  params: {
    uid: string;
  };
}

interface UserData {
  uid: string;
  email: string;
  is_active: boolean;
  kind: string;
  is_verified: boolean;
  is_subscribed: boolean;
}

const UserDetailsPage = ({ params }: UserDetailsPageProps) => {
  const { uid } = params;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);

      await new Promise((res) => setTimeout(res, 1000));

      const mockData: UserData = {
        uid,
        email: "dekitasatoshi@gmail.com",
        is_active: true,
        kind: "END_USER",
        is_verified: true,
        is_subscribed: false,
      };

      setUserData(mockData);
      setLoading(false);
    };

    fetchUserData();
  }, [uid]);

  const handleEditProfile = () => {
    // Handle edit profile logic here
    console.log("Edit profile clicked for user:", uid);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            User Not Found
          </h2>
          <p className="text-gray-600">
            The requested user could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Details
          </h1>
          <p className="text-gray-600">Manage and view user information</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-white rounded-full p-4 mb-4">
                <User className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {userData.email.split("@")[0]}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm text-black">
                  {userData.kind.replace("_", " ")}
                </span>
                {userData.is_verified && (
                  <CheckCircle className="h-5 w-5 text-green-300" />
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* User Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Account Information
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="text-gray-900 font-medium">
                        {userData.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">User ID</p>
                      <p className="text-gray-900 font-mono text-sm">
                        {userData.uid}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Account Type</p>
                      <p className="text-gray-900 font-medium">
                        {userData.kind.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Account Status
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          userData.is_active ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-gray-700">Account Status</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userData.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {userData.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle
                        className={`h-5 w-5 ${
                          userData.is_verified
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="text-gray-700">Verification Status</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userData.is_verified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {userData.is_verified ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Crown
                        className={`h-5 w-5 ${
                          userData.is_subscribed
                            ? "text-yellow-500"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="text-gray-700">Subscription Status</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userData.is_subscribed
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {userData.is_subscribed ? "Subscribed" : "Free"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleEditProfile}
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  <Edit3 className="h-5 w-5 mr-2" />
                  Edit Profile
                </button>
                <button className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium">
                  <Mail className="h-5 w-5 mr-2" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;
