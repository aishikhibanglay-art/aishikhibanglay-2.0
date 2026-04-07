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

// Student Dashboard pages
import DashboardHome from "@/pages/dashboard/DashboardHome";
import MyCourses from "@/pages/dashboard/MyCourses";
import CourseLearning from "@/pages/dashboard/CourseLearning";
import CourseQuiz from "@/pages/dashboard/CourseQuiz";
import Certificates from "@/pages/dashboard/Certificates";
import Community from "@/pages/dashboard/Community";
import ProfileSettings from "@/pages/dashboard/ProfileSettings";
import BillingHistory from "@/pages/dashboard/BillingHistory";

// 404
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

const STUDENT_ROLES = ["student", "admin", "super_admin", "moderator"] as const;

function Router() {
  return (
    <Switch>
      {/* Public auth routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />

      {/* Student dashboard routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute allowedRoles={[...STUDENT_ROLES]}><DashboardHome /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/courses">
        {() => <ProtectedRoute allowedRoles={[...STUDENT_ROLES]}><MyCourses /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/courses/:id/learn">
        {() => <ProtectedRoute allowedRoles={[...STUDENT_ROLES]}><CourseLearning /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/courses/:id/quiz">
        {() => <ProtectedRoute allowedRoles={[...STUDENT_ROLES]}><CourseQuiz /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/certificates">
        {() => <ProtectedRoute allowedRoles={[...STUDENT_ROLES]}><Certificates /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/community">
        {() => <ProtectedRoute allowedRoles={[...STUDENT_ROLES]}><Community /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/profile">
        {() => <ProtectedRoute allowedRoles={[...STUDENT_ROLES]}><ProfileSettings /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/billing">
        {() => <ProtectedRoute allowedRoles={[...STUDENT_ROLES]}><BillingHistory /></ProtectedRoute>}
      </Route>

      {/* Root → login */}
      <Route path="/" component={LoginPage} />

      {/* 404 */}
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
