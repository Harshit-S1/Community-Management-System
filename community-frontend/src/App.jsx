import React from 'react';
import RoleRedirect from './components/RoleRedirect';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Login from './pages/Login';
import Setup from './pages/Setup';

// Common Authenticated Pages
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminTickets from './pages/AdminTickets';
import AdminVisitors from './pages/AdminVisitors';
import AdminFinances from './pages/AdminFinances';
import AdminDirectory from './pages/AdminDirectory';
import AdminCommunity from './pages/AdminCommunity';

// Resident Pages
import ResidentFeed from './pages/ResidentFeed';
import ResidentNotices from './pages/ResidentNotices';
import ResidentFinances from './pages/ResidentFinances';
import ResidentVisitors from './pages/ResidentVisitors';
import ResidentDirectory from './pages/ResidentDirectory';

// Guard Pages
import GuardDashboard from './pages/GuardDashboard';

const App = () => {
  return (
        <Routes>
            {/* Rendering the public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<Setup />} />

            {/* Rendering the protected application routes */}
            <Route path="/" element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                    <Route index element={<RoleRedirect />} />
                    <Route path="profile" element={<Profile />} />

                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="admin/dashboard" element={<AdminDashboard />} />
                        <Route path="admin/tickets" element={<AdminTickets />} />
                        <Route path="admin/visitors" element={<AdminVisitors />} />
                        <Route path="admin/finances" element={<AdminFinances />} />
                        <Route path="admin/directory" element={<AdminDirectory />} />
                        <Route path="admin/community" element={<AdminCommunity />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['resident']} />}>
                        <Route path="resident/feed" element={<ResidentFeed />} />
                        <Route path="resident/notices" element={<ResidentNotices />} />
                        <Route path="resident/finances" element={<ResidentFinances />} />
                        <Route path="resident/visitors" element={<ResidentVisitors />} />
                        <Route path="resident/directory" element={<ResidentDirectory />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['guard']} />}>
                        <Route path="guard/dashboard" element={<GuardDashboard />} />
                        <Route path="guard/directory" element={<ResidentDirectory />} />
                    </Route>
                </Route>
            </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
  );
};

export default App;