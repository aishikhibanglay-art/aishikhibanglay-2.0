import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import AuthCallbackPage from "@/pages/auth/AuthCallbackPage";

// Student Dashboard
import DashboardHome from "@/pages/dashboard/DashboardHome";
import MyCourses from "@/pages/dashboard/MyCourses";
import CourseLearning from "@/pages/dashboard/CourseLearning";
import CourseQuiz from "@/pages/dashboard/CourseQuiz";
import Certificates from "@/pages/dashboard/Certificates";
import Community from "@/pages/dashboard/Community";
import ProfileSettings from "@/pages/dashboard/ProfileSettings";
import BillingHistory from "@/pages/dashboard/BillingHistory";

// Admin Panel
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UsersManagement from "@/pages/admin/UsersManagement";
import CoursesManagement from "@/pages/admin/CoursesManagement";
import PaymentsPage from "@/pages/admin/PaymentsPage";
import CommunityModeration from "@/pages/admin/CommunityModeration";
import SiteSettings from "@/pages/admin/SiteSettings";

// 404
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

const ALL_ROLES = ["student", "admin", "super_admin", "moderator"] as const;
const ADMIN_ROLES = ["admin", "super_admin"] as const;
const MOD_ROLES = ["admin", "super_admin", "moderator"] as const;
const SUPER_ADMIN_ONLY = ["super_admin"] as const;

function Router() {
  return (
    <Switch>
      {/* Public auth routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />

      {/* ── Student Routes ── */}
      <Route path="/dashboard">
        {() => <ProtectedRoute allowedRoles={[...ALL_ROLES]}><DashboardHome /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/courses">
        {() => <ProtectedRoute allowedRoles={[...ALL_ROLES]}><MyCourses /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/courses/:id/learn">
        {() => <ProtectedRoute allowedRoles={[...ALL_ROLES]}><CourseLearning /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/courses/:id/quiz">
        {() => <ProtectedRoute allowedRoles={[...ALL_ROLES]}><CourseQuiz /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/certificates">
        {() => <ProtectedRoute allowedRoles={[...ALL_ROLES]}><Certificates /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/community">
        {() => <ProtectedRoute allowedRoles={[...ALL_ROLES]}><Community /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/profile">
        {() => <ProtectedRoute allowedRoles={[...ALL_ROLES]}><ProfileSettings /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/billing">
        {() => <ProtectedRoute allowedRoles={[...ALL_ROLES]}><BillingHistory /></ProtectedRoute>}
      </Route>

      {/* ── Admin Routes ── */}
      <Route path="/admin">
        {() => <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}><AdminDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute allowedRoles={[...SUPER_ADMIN_ONLY]}><UsersManagement /></ProtectedRoute>}
      </Route>
      <Route path="/admin/courses">
        {() => <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}><CoursesManagement /></ProtectedRoute>}
      </Route>
      <Route path="/admin/payments">
        {() => <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}><PaymentsPage /></ProtectedRoute>}
      </Route>
      <Route path="/admin/community">
        {() => <ProtectedRoute allowedRoles={[...MOD_ROLES]}><CommunityModeration /></ProtectedRoute>}
      </Route>
      <Route path="/admin/settings">
        {() => <ProtectedRoute allowedRoles={["super_admin"]}><SiteSettings /></ProtectedRoute>}
      </Route>

      {/* Root → login */}
      <Route path="/" component={LoginPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
