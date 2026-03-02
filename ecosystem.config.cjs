module.exports = {
  apps: [
    {
      name: 'server',
      script: 'dist/server/node-build.mjs',
      cwd: '/var/www/cvzen',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Add your production database URL here
        // DATABASE_URL: 'postgresql://user:password@host:5432/database',
        // JWT_SECRET: 'your-production-jwt-secret'
      },
      error_file: '/var/www/cvzen/logs/server-error.log',
      out_file: '/var/www/cvzen/logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
    // Note: Client static files should be served by nginx, not PM2
    // If you need PM2 to serve static files for testing, install serve globally:
    // npm install -g serve
    // Then uncomment below:
    // {
    //   name: 'client',
    //   script: 'serve',
    //   args: ['-s', 'dist/spa', '-p', '8080'],
    //   cwd: '/var/www/cvzen',
    //   instances: 1,
    //   exec_mode: 'fork',
    //   env: {
    //     NODE_ENV: 'production'
    //   }
    // }
  ]
};
