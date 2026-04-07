import React, { useState, useEffect, useContext } from "react";
import { Eye, Edit3, Plus, X, Save, Trash2, Shield, UserCog, Mail, Lock } from "lucide-react";
import NavBar from "../../component/navigation";
import Sidebar from "../../component/sidebar";
import { useTheme } from "../../context/ThemeContext";
import { AuthContext } from "../../context/authContext";
import API from "../../utils/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ROLE_OPTIONS = [
  { value: "super-admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "inventory-staff", label: "Inventory Staff" },
  { value: "front-desk", label: "Front Desk" },
];

const normalizeRoleValue = (role) => {
  return role
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const formatRoleLabel = (role) => {
  const matchedRole = ROLE_OPTIONS.find((option) => option.value === role);
  if (matchedRole) return matchedRole.label;

  if (!role) return "Unknown";

  return role
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const UserManagement = () => {
  const { darkMode } = useTheme();
  const PAGE_SIZE = 10;
  const { user } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin"
  });

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [users.length]);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const paginatedUsers = users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/users");
      console.log("Fetched users:", res.data);
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "admin"
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || "",
      email: user.email || "",
      password: "", // Don't populate password for security
      role: user.role || "admin"
    });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    // Validation
    if (!formData.username.trim()) {
      toast.error("username is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      toast.error("Password is required for new users");
      return;
    }
    if (!formData.role) {
      toast.error("Role is required");
      return;
    }

    const normalizedRole = normalizeRoleValue(formData.role);
    if (!normalizedRole) {
      toast.error("Please enter a valid role");
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        const payload = {
          username: formData.username,
          email: formData.email,
          role: normalizedRole
        };
        // Only include password if it's provided
        if (formData.password) {
          payload.password = formData.password;
        }

        await API.put(`/users/${editingUser.id}`, payload);
        toast.success("User updated successfully!");
      } else {
        // Create new user
        const payload = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: normalizedRole
        };
        await API.post("/users", payload);
        toast.success("User created successfully!");
      }
      
      await fetchUsers();
      setShowModal(false);
      setEditingUser(null);
    } catch (err) {
      console.error("Save user error:", err);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to save user");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    
    setDeleting(true);
    try {
      await API.delete(`/users/${deleteModal.id}`);
      setUsers(prev => prev.filter(u => u.id !== deleteModal.id));
      setDeleteModal(null);
      toast.success("User deleted successfully!");
    } catch (err) {
      console.error("Delete user error:", err);
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadgeStyle = (role) => {
    if (role === 'super-admin') {
      return darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700';
    }
    if (role === 'admin') {
      return darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700';
    }
    if (role === 'inventory-staff') {
      return darkMode ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
    }
    if (role === 'front-desk') {
      return darkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-700';
    }
    return darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700';
  };

  const isSuperAdmin = user?.role === 'super-admin';

  return (
    <div className={`min-h-screen block lg:flex transition-colors ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <NavBar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-4 md:p-6 mt-20 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Manage system users and their roles
              </p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition"
              >
                <Plus size={20} />
                Add New User
              </button>
            )}
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <UserCog size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 mb-4">No users found</p>
              {isSuperAdmin && (
                <button
                  onClick={openAddModal}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first user
                </button>
              )}
            </div>
          ) : (
            <div className={`rounded-2xl shadow-xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      {["ID", "username", "Email", "Role", "Created", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs uppercase font-bold text-left opacity-70">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className={`border-t ${darkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-100 hover:bg-gray-50"}`}>
                        <td className="px-4 py-3 font-mono text-sm text-blue-500">{user.id}</td>
                        <td className="px-4 py-3 font-medium">{user.username}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeStyle(user.role)}`}>
                            {formatRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewModal(user)}
                              className={`p-2 rounded-lg transition ${
                                darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                              }`}
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            {isSuperAdmin && (
                              <>
                                <button
                                  onClick={() => openEditModal(user)}
                                  className={`p-2 rounded-lg transition ${
                                    darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                                  }`}
                                  title="Edit"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button
                                  onClick={() => setDeleteModal(user)}
                                  className={`p-2 rounded-lg transition ${
                                    darkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-200 text-red-600"
                                  }`}
                                  title="Delete"
                                  disabled={user.role === 'super-admin'} // Prevent deleting super-admin
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 mt-3 text-xs transition-colors">
              <span className="italic">{`Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, users.length)} of ${users.length} entries`}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Add/Edit User Modal */}
          {showModal && isSuperAdmin && (
            <UserModal
              onClose={() => { setShowModal(false); setEditingUser(null); }}
              onSave={handleSaveUser}
              formData={formData}
              onChange={handleInputChange}
              editingUser={editingUser}
              darkMode={darkMode}
            />
          )}

          {/* View User Modal */}
          {viewModal && (
            <ViewUserModal
              user={viewModal}
              onClose={() => setViewModal(null)}
              darkMode={darkMode}
            />
          )}

          {/* Delete Confirmation Modal */}
          {deleteModal && isSuperAdmin && (
            <DeleteConfirmationModal
              onClose={() => setDeleteModal(null)}
              onConfirm={handleDeleteUser}
              user={deleteModal}
              darkMode={darkMode}
              deleting={deleting}
            />
          )}
        </main>
      </div>
    </div>
  );
};

/* ================== ADD/EDIT USER MODAL ================== */
const UserModal = ({ onClose, onSave, formData, onChange, editingUser, darkMode }) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputClass = `w-full px-4 py-2.5 rounded-lg outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${
    darkMode 
      ? "bg-gray-700 text-gray-200 border border-gray-600" 
      : "bg-white text-gray-900 border border-gray-300"
  }`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-2xl p-6 relative ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6">
          {editingUser ? 'Edit User' : 'Add New User'}
        </h2>

        <div className="space-y-4">
          {/* username */}
          <div>
            <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Full username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={onChange}
              placeholder="Enter full username"
              className={inputClass}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="Enter email address"
              className={inputClass}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={onChange}
                placeholder={editingUser ? "Enter new password" : "Enter password"}
                className={`${inputClass} pr-10`}
                required={!editingUser}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                <Lock size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              User Role *
            </label>
            <input
              type="text"
              list="role-options"
              name="role"
              value={formData.role}
              onChange={onChange}
              placeholder="Select or type a role"
              className={inputClass}
              required
            />
            <datalist id="role-options">
              {ROLE_OPTIONS.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </option>
              ))}
            </datalist>
            <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Suggested roles: super-admin, admin, inventory-staff, front-desk. You can type a custom role too.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Save size={18} />
            {editingUser ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================== VIEW USER MODAL ================== */
const ViewUserModal = ({ user, onClose, darkMode }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-2xl p-6 relative ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6">User Details</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 py-2 border-b dark:border-gray-700">
            <span className="font-medium opacity-70">ID</span>
            <span className="col-span-2 font-mono text-blue-500">{user.id}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 py-2 border-b dark:border-gray-700">
            <span className="font-medium opacity-70">username</span>
            <span className="col-span-2">{user.username}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 py-2 border-b dark:border-gray-700">
            <span className="font-medium opacity-70">Email</span>
            <span className="col-span-2">{user.email}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 py-2 border-b dark:border-gray-700">
            <span className="font-medium opacity-70">Role</span>
            <span className="col-span-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeStyle(user.role, darkMode)}`}>
                {formatRoleLabel(user.role)}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 py-2 border-b dark:border-gray-700">
            <span className="font-medium opacity-70">Created</span>
            <span className="col-span-2">
              {user.created_at ? new Date(user.created_at).toLocaleString() : '-'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 py-2">
            <span className="font-medium opacity-70">Last Updated</span>
            <span className="col-span-2">
              {user.updated_at ? new Date(user.updated_at).toLocaleString() : '-'}
            </span>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================== DELETE CONFIRMATION MODAL ================== */
const DeleteConfirmationModal = ({ onClose, onConfirm, user, darkMode, deleting }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-2xl p-6 relative ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          disabled={deleting}
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              darkMode ? "bg-red-900/20" : "bg-red-100"
            }`}>
              <Trash2 size={40} className="text-red-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-2">Delete User</h2>
          
          <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} mb-4`}>
            Are you sure you want to delete this user?
          </p>
          
          <div className={`p-4 rounded-lg text-left mb-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <p className="font-bold">{user.username}</p>
            <p className="text-sm mt-1">{user.email}</p>
            <p className="text-sm mt-1">
              Role: <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                getRoleBadgeStyle(user.role, darkMode)
              }`}>
                {formatRoleLabel(user.role)}
              </span>
            </p>
          </div>
          
          <p className="text-sm text-red-600 font-medium">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              darkMode 
                ? "bg-gray-700 hover:bg-gray-600 text-white" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            } ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting || user.role === 'super-admin'}
            className="flex-1 px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

function getRoleBadgeStyle(role, darkMode) {
  if (role === "super-admin") {
    return darkMode ? "bg-purple-900 text-purple-300" : "bg-purple-100 text-purple-700";
  }
  if (role === "admin") {
    return darkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-700";
  }
  if (role === "inventory-staff") {
    return darkMode ? "bg-emerald-900 text-emerald-300" : "bg-emerald-100 text-emerald-700";
  }
  if (role === "front-desk") {
    return darkMode ? "bg-amber-900 text-amber-300" : "bg-amber-100 text-amber-700";
  }
  return darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-700";
}