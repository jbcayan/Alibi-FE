"use client";
import React, { useState, useEffect, use } from "react";
import {
  User,
  Edit3,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Crown,
  RefreshCw,
} from "lucide-react";
import { UpdateUserData, UserData } from "@/types/admin/user";
import { adminAPIClient } from "@/infrastructure/admin/adminAPIClient";
import EditUserModal from "@/components/admin/EditUserModal";

interface UserDetailsPageProps {
  params: {
    uid: string;
  };
}

const UserDetailsPage = ({ params }: UserDetailsPageProps) => {
  const { uid } = use(params);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = async () => {
    try {
      setError(null);
      const data = await adminAPIClient.getUserById(uid);
      setUserData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [uid]);

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (updateData: UpdateUserData) => {
    try {
      const updatedUser = await adminAPIClient.updateUser(uid, updateData);
      setUserData(updatedUser);

      // You can add a toast notification here
      console.log("User updated successfully");
    } catch (err) {
      console.error("Failed to update user:", err);
      throw err; // Re-throw to let the modal handle the error
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error?.includes("見つかりません")
              ? "User Not Found"
              : "Error Loading User"}
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "The requested user could not be found."}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 mt-8 lg:mt-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              User Details
            </h1>
            <p className="text-gray-600">Manage and view user information</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
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

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userData={userData}
        onSave={handleUpdateUser}
      />
    </div>
  );
};

export default UserDetailsPage;
