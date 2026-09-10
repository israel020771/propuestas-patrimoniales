module.exports = {
  apps: [
    {
      name: 'propuestas-patrimoniales',
      script: './server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: 'tu-servidor.com',
      ref: 'origin/main',
      repo: 'git@github.com:tu-usuario/propuestas-patrimoniales.git',
      path: '/var/www/propuestas',
      'post-deploy': 'npm install && pm2 restart ecosystem.config.js --env production'
    }
  }
};
