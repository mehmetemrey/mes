import { defineConfig } from 'umi';

export default defineConfig({
  npmClient: 'npm',
  title: 'MES - Üretim Yürütme Sistemi',
  favicons: ['/favicon.svg'],
  links: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'alternate icon', href: '/favicon.ico' }
  ],
  
  // Production optimizasyonları
  hash: true,
  targets: {
    chrome: 79,
    firefox: 72,
    safari: 13,
    edge: 79,
  },
  
  // Minification ayarları
  jsMinifier: 'terser',
  esbuildMinifyIIFE: true,
  
  // Environment variables
  define: {
    'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
    'process.env.API_URL': process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5055/api',
  },
  
  // Production build ayarları
  ...(process.env.NODE_ENV === 'production' && {
    publicPath: '/',
    outputPath: 'dist',
    chainWebpack: (config) => {
      // Production optimizasyonları
      config.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            enforce: true,
          },
        },
      });
    },
  }),
  
  mfsu: {
    shared: {
      react: {
        singleton: true,
        requiredVersion: '^18.0.0',
      },
      'react-dom': {
        singleton: true,
        requiredVersion: '^18.0.0',
      },
      'socket.io-client': {
        singleton: true,
        requiredVersion: '^4.7.5',
      },
    },
  },

  routes: [
    {
      path: '/',
      component: '@/layouts/PublicHeader/index',
      routes: [
        { path: '/', component: '@/pages/Home/index' },
        { path: '/about', component: '@/pages/About/index' },
        { path: '/contact', component: '@/pages/Contact/index' },
        { path: '/login', component: '@/pages/Login/index' },
        { path: '/forgot-password', component: '@/pages/ForgotPassword/index' },
        { path: '/set-password/:token', component: '@/pages/SetPassword/index' },
        { path: '/token-error', component: '@/pages/TokenError/index' },
      ],
    },
    {
      path: '/dashboard',
      component: '@/layouts/DashboardSide/index',
      routes: [
        { path: '/dashboard', component: '@/pages/Dashboard/index' },
        { path: '/dashboard/profile', component: '@/pages/Profile/index' },
        { path: '/dashboard/notifications', component: '@/pages/Notifications/index' },
        { path: '/dashboard/announcements', component: '@/pages/Announcements/index' },
        { path: '/dashboard/announcements/add', component: '@/pages/AnnouncementAdd/index' },
        { path: '/dashboard/announcements/edit/:id', component: '@/pages/AnnouncementEdit/index' },

        { path: '/dashboard/machines-live', component: '@/pages/LiveMachines/index' },
        { path: '/dashboard/machines-live/:id', component: '@/pages/LiveMachineDetail/index' },

        { path: '/dashboard/reports', component: '@/pages/Reports/index' },

        { path: '/dashboard/mail', component: '@/pages/SendMail/index' },

        { path: '/dashboard/users', component: '@/pages/Users/index' },
        { path: '/dashboard/users/:id', component: '@/pages/UserDetail/index' },
        { path: '/dashboard/users/edit/:id', component: '@/pages/UserEdit/index' },
        { path: '/dashboard/users/add', component: '@/pages/UserAdd/index' },

        { path: '/dashboard/roles', component: '@/pages/Roles/index' },
        { path: '/dashboard/roles/:id', component: '@/pages/RoleDetail/index' },
        { path: '/dashboard/roles/edit/:id', component: '@/pages/RoleEdit/index' },
        { path: '/dashboard/roles/add', component: '@/pages/RoleAdd/index' },

        
        // Üretim Aşamaları Rotaları
        { path: '/dashboard/production-stages', component: '@/pages/ProductionStages/index' },
        { path: '/dashboard/production-stages/:id', component: '@/pages/ProductionStageDetail/index' },
        { path: '/dashboard/production-stages/edit/:id', component: '@/pages/ProductionStagesEdit/index' },
        { path: '/dashboard/production-stages/add', component: '@/pages/ProductionStagesAdd/index' },
        
        // Makineler Rotaları
        { path: '/dashboard/machines', component: '@/pages/Machines/index' },
        { path: '/dashboard/machines/add', component: '@/pages/MachineAdd/index' },
        { path: '/dashboard/machines/edit/:id', component: '@/pages/MachineEdit/index' },
        { path: '/dashboard/machines/:id', component: '@/pages/MachineDetail/index' },

        { path: '/dashboard/job-orders', component: '@/pages/JobOrders/index' },
        { path: '/dashboard/job-orders/add', component: '@/pages/JobOrderCreate/index' },
        { path: '/dashboard/job-orders/edit/:id', component: '@/pages/JobOrderEdit/index' },
        { path: '/dashboard/job-orders/:id', component: '@/pages/JobOrderDetail/index' },
        
        // Departman Rotaları
        { path: '/dashboard/departments', component: '@/pages/Departments/index' },
        { path: '/dashboard/departments/add', component: '@/pages/DepartmentAdd/index' },
        { path: '/dashboard/departments/:id', component: '@/pages/DepartmentDetailPage/index' },
        { path: '/dashboard/departments/edit/:id', component: '@/pages/DepartmentEdit/index' },

        // Üretim Hattı Rotaları
        { path: '/dashboard/production-lines', component: '@/pages/ProductionLines/index' },
        { path: '/dashboard/production-lines/add', component: '@/pages/ProductionLinesAdd/index' },
        { path: '/dashboard/production-lines/edit/:id', component: '@/pages/ProductionLinesEdit/index' },
        { path: '/dashboard/production-lines/:id', component: '@/pages/ProductionLinesDetail/index' },
      ],
    },
    { path: '/404', component: '@/pages/404' },
    { path: '/403', component: '@/pages/403' },
    { path: '*', component: '@/pages/404' },
  ],
});