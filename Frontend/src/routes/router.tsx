import { createBrowserRouter, Navigate } from 'react-router' //
import { ProtectedRoute } from './ProtectedRoute'
import { PublisherRoute } from './PublisherRoute'
import { ReaderAccessRoute, SupportAccessRoute } from './AccessRoutes'
import RouteError from '@/components/common/RouteError'
import NotFound from '@/app/NotFound'


// ===== Layouts =====
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthorLayout } from '@/components/layout/AuthorLayout'
import { PublisherLayout } from '@/components/layout/PublisherLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { BareLayout } from '@/components/layout/BareLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// ===== Trang Auth =====
import { Login } from '@/features/auth/pages/Login'
import { Register } from '@/features/auth/pages/Register'


//======= HÀM TẢI TRANG THEO NHU CẦU =============
const lazyPage = <T extends Record<string, unknown>>(
  loader: () => Promise<T>,
  name: keyof T,
) => ({
  lazy: async () => ({ Component: (await loader())[name] as React.ComponentType }),
})


// ============ NƠI KHÁI BÁO TOÀN BỘ URL CỦA NOVA MANGA============
export const router = createBrowserRouter([

  // nhóm trang đăng nhập và đăng ký.
  {
    element: <AuthLayout />, //layout hiển thị 
    errorElement: <RouteError />,
    children: [ //chứa các trang con
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ],
  },


//================ khu vực Onboarding dành cho người dùng đã đăng nhập và thỏa mãn điều kiện Reader=========
  {
    path: 'onboarding',
    element: <ProtectedRoute />, // kiểm tra đăng nhập 
    errorElement: <RouteError />,
    children: [
      {
        element: <ReaderAccessRoute />, //kiểm tra quyền reader
        children: [
          //trang chọn sở thích ban đầu 
          { index: true, ...lazyPage(() => import('@/features/catalog/pages/Onboarding'), 'Onboarding') },
        ],
      },
    ],
  },

  // Khu User
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteError />,
    children: [ //tất cả các trang con dùng main layout
      //các trang công khai 
      { index: true, ...lazyPage(() => import('@/features/catalog/pages/Home'), 'Home') },
      { path: 'manga', ...lazyPage(() => import('@/features/catalog/pages/Home'), 'Home') },
      { path: 'novel', ...lazyPage(() => import('@/features/catalog/pages/Home'), 'Home') },
      { path: 'content/:id', ...lazyPage(() => import('@/features/content/pages/ContentDetail'), 'ContentDetail') },
      { path: 'profile/:id', ...lazyPage(() => import('@/features/profile/pages/Profile'), 'Profile') },
      { path: 'content/:id/read-manga/:chapterId', ...lazyPage(() => import('@/features/reader/pages/ReadManga'), 'ReadManga') },
      { path: 'content/:id/read-novel/:chapterId', ...lazyPage(() => import('@/features/reader/pages/ReadNovel'), 'ReadNovel') },
      {
        element: <ProtectedRoute />,
        //toàn bộ các routecon phải đi qua protected route để kiểm tra đăng nhập 
        children: [
          { path: 'library', ...lazyPage(() => import('@/features/library/pages/Library'), 'Library') },
          { path: 'history', ...lazyPage(() => import('@/features/reading-history/pages/History'), 'History') },
          { path: 'settings/preferences', ...lazyPage(() => import('@/features/catalog/pages/GenrePreferences'), 'GenrePreferences') },
          { path: 'inbox', ...lazyPage(() => import('@/features/notifications/pages/Inbox'), 'Inbox') },  
          { path: 'my-reports', ...lazyPage(() => import('@/features/reports/pages/MyReports'), 'MyReports') },
          { path: 'earnings', ...lazyPage(() => import('@/features/creator/pages/shared/Earnings'), 'Earnings') },
          {
            element: <ReaderAccessRoute />,
            //kiểm tra quyển reader. đăng nhập xong mới kiểm tra quyền 
            children: [
              { path: 'wallet', ...lazyPage(() => import('@/features/wallet/pages/Wallet'), 'Wallet') },
            ],
          },
          {
            element: <SupportAccessRoute />,
            //kiểm tra quyền suppport 
            children: [
              { path: 'support', ...lazyPage(() => import('@/features/support/pages/SupportTickets'), 'SupportTickets') },
              { path: 'support/:id', ...lazyPage(() => import('@/features/support/pages/SupportDetail'), 'SupportDetail') },
            ],
          },
          { path: 'assistant', ...lazyPage(() => import('@/features/ai/pages/AiAssistant'), 'AiAssistant') },
          { path: 'assistant/:contentId', ...lazyPage(() => import('@/features/ai/pages/AiAssistant'), 'AiAssistant') },
        ],
      },
    ],
  },

  // Khu Author: mọi user đã login
  {
    path: 'author',
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AuthorLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', ...lazyPage(() => import('@/features/creator/pages/author/Dashboard'), 'AuthorDashboard') },
          { path: 'create', ...lazyPage(() => import('@/features/creator/pages/shared/CreateStory'), 'CreateStory') },
          { path: 'upload/manga', ...lazyPage(() => import('@/features/creator/pages/author/UploadManga'), 'UploadManga') },
          { path: 'upload/novel', ...lazyPage(() => import('@/features/creator/pages/author/UploadNovel'), 'UploadNovel') },
          { path: 'upload/translation', ...lazyPage(() => import('@/features/creator/pages/author/UploadTranslation'), 'UploadTranslation') },
          // Shared Chapter & Content Management
          { path: 'content/:id/chapters/new', ...lazyPage(() => import('@/features/creator/pages/shared/UploadChapter'), 'SharedUploadChapter') },
          { path: 'content/:id/chapters/:chapterId/edit', ...lazyPage(() => import('@/features/creator/pages/shared/EditChapter'), 'SharedEditChapter') },
          { path: 'content/:id/edit', ...lazyPage(() => import('@/features/creator/pages/shared/EditStory'), 'SharedEditStory') },
        ],
      },
    ],
  },

  // Khu Publisher
  {
    path: 'publisher',
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        element: <ProtectedRoute />,
        children: [
          // Chưa cần là Publisher: chỉ Navbar
          {
            element: <BareLayout />,
            children: [
              { path: 'register', ...lazyPage(() => import('@/features/creator/pages/publisher/Register'), 'PublisherRegister') },
              { path: 'status', ...lazyPage(() => import('@/features/creator/pages/publisher/Status'), 'PublisherStatus') },
            ],
          },
          // Cần Approved: có sidebar
          {
            element: <PublisherRoute />,
            children: [
              {
                element: <PublisherLayout />,
                children: [
                  { path: 'dashboard', ...lazyPage(() => import('@/features/creator/pages/publisher/Dashboard'), 'PublisherDashboard') },
                  { path: 'create', ...lazyPage(() => import('@/features/creator/pages/shared/CreateStory'), 'CreateStory') },
                  { path: 'catalog', ...lazyPage(() => import('@/features/creator/pages/publisher/SeriesCatalog'), 'SeriesCatalog') },
                  { path: 'catalog/:id/resubmit', ...lazyPage(() => import('@/features/creator/pages/publisher/ResubmitSeries'), 'ResubmitSeries') },
                  { path: 'compliance', ...lazyPage(() => import('@/features/creator/pages/publisher/Compliance'), 'Compliance') },
                  { path: 'upload/manga', ...lazyPage(() => import('@/features/creator/pages/publisher/UploadManga'), 'PublisherUploadManga') },
                  { path: 'upload/novel', ...lazyPage(() => import('@/features/creator/pages/publisher/UploadNovel'), 'PublisherUploadNovel') },
                  // Shared Chapter & Content Management
                  { path: 'content/:id/chapters/new', ...lazyPage(() => import('@/features/creator/pages/shared/UploadChapter'), 'SharedUploadChapter') },
                  { path: 'content/:id/chapters/:chapterId/edit', ...lazyPage(() => import('@/features/creator/pages/shared/EditChapter'), 'SharedEditChapter') },
                  { path: 'content/:id/edit', ...lazyPage(() => import('@/features/creator/pages/shared/EditStory'), 'SharedEditStory') },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // Khu Admin
  {
    path: 'admin',
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', ...lazyPage(() => import('@/features/admin/pages/Dashboard'), 'AdminDashboard') },
          { path: 'review-queue', element: <Navigate to="/admin/content/unpublished" replace /> },
          { path: 'content/published', ...lazyPage(() => import('@/features/admin/pages/ContentManagement'), 'ContentManagement') },
          { path: 'content/unpublished', ...lazyPage(() => import('@/features/admin/pages/ReviewQueue'), 'ReviewQueue') },
          { path: 'chapters/pending', ...lazyPage(() => import('@/features/admin/pages/ChapterReviewQueue'), 'ChapterReviewQueue') },
          { path: 'chapters/:id', ...lazyPage(() => import('@/features/admin/pages/ChapterReview'), 'ChapterReview') },
          { path: 'content/:id', ...lazyPage(() => import('@/features/admin/pages/ContentDetail'), 'ContentDetail') },
          { path: 'reports', ...lazyPage(() => import('@/features/admin/pages/Reports'), 'Reports') },
          { path: 'novel-moderation', element: <Navigate to="/admin/content/unpublished" replace /> },
          { path: 'users', ...lazyPage(() => import('@/features/admin/pages/Users'), 'Users') },
          { path: 'tickets', ...lazyPage(() => import('@/features/admin/pages/AdminTickets'), 'AdminTickets') },
          { path: 'payments', ...lazyPage(() => import('@/features/admin/pages/Payments'), 'Payments') },
          { path: 'payouts', ...lazyPage(() => import('@/features/admin/pages/Payouts'), 'Payouts') },
          { path: 'ai', ...lazyPage(() => import('@/features/admin/pages/AiSettings'), 'AiSettings') },
        ],
      },
    ],
  },

  { path: '*', element: <NotFound /> },
])
